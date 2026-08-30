import "server-only";
import { subDays, differenceInCalendarDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type {
  AiTriggerType,
  Database,
} from "@/lib/types/database";
import type {
  DailyReadiness,
  ExercisePerformance,
  PeriodizationContext,
  RoutineTargetSnapshot,
} from "@/lib/ai/prompt";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Junta todo lo que necesita el motor de IA para el mesociclo/microciclo activo del usuario. */
export async function buildPeriodizationContext(
  supabase: SupabaseServerClient,
  triggerType: AiTriggerType,
): Promise<{ context: PeriodizationContext; mesocycleId: string | null } | { error: string }> {
  const { data: mesocycle } = await supabase
    .from("mesocycles")
    .select("*, macrocycles(goal)")
    .eq("status", "active")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!mesocycle) {
    return { error: "No hay un mesociclo activo — crea uno antes de generar un plan con IA." };
  }

  const { data: microcycle } = await supabase
    .from("microcycles")
    .select("*")
    .eq("mesocycle_id", mesocycle.id)
    .eq("status", "active")
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .maybeSingle();

  const { data: bodyMetrics } = await supabase
    .from("body_metrics")
    .select("log_date, weight_kg")
    .order("log_date", { ascending: false })
    .limit(30);

  const latestWeight = bodyMetrics?.[0]?.weight_kg ?? null;
  const trend7d = averageWeightSince(bodyMetrics, 7);
  const trend28d = averageWeightSince(bodyMetrics, 28);

  const { data: readinessRows } = await supabase
    .from("readiness_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(14);

  const recentReadiness: DailyReadiness[] = (readinessRows ?? []).map((r) => ({
    date: r.log_date,
    shiftType: r.shift_type,
    trained: r.will_train,
    sleepHours: r.sleep_hours,
    sleepQuality: r.sleep_quality,
    stressLevel: r.stress_level,
    muscleSoreness: r.muscle_soreness,
    energyLevel: r.energy_level,
  }));

  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(*, exercises(name), target_sets(*))")
    .eq("microcycle_id", microcycle?.id ?? "__none__");

  const currentTargets: RoutineTargetSnapshot[] = (routines ?? []).map((r) => ({
    dayLabel: r.day_label ?? r.title,
    exercises: (r.routine_exercises ?? []).map((re) => ({
      exerciseName: re.exercises?.name ?? "desconocido",
      targetSets: re.target_sets?.length ?? 0,
      targetRepsMin: re.target_sets?.[0]?.target_reps_min ?? null,
      targetRepsMax: re.target_sets?.[0]?.target_reps_max ?? null,
      targetRpe: re.target_sets?.[0]?.target_rpe ?? null,
      targetWeightKg: re.target_sets?.[0]?.target_weight_kg ?? null,
    })),
  }));

  const exercisePerformance = await buildExercisePerformance(supabase, routines ?? []);

  const context: PeriodizationContext = {
    triggerType,
    athlete: {
      goal: settings?.goal ?? mesocycle.macrocycles?.goal ?? "recomposición corporal",
      experienceYears: settings?.experience_years ?? 3,
      bodyWeightKg: latestWeight,
      bodyWeightTrend7d: trend7d,
      bodyWeightTrend28d: trend28d,
    },
    mesocycle: {
      name: mesocycle.name,
      phase: mesocycle.phase,
      weekNumber: microcycle?.week_number ?? 1,
      plannedWeeks: mesocycle.planned_weeks,
    },
    currentTargets,
    recentReadiness,
    exercisePerformance,
  };

  return { context, mesocycleId: mesocycle.id };
}

function averageWeightSince(
  rows: Array<{ log_date: string; weight_kg: number | null }> | null,
  days: number,
): number | null {
  if (!rows) return null;
  const cutoff = subDays(new Date(), days);
  const inWindow = rows.filter(
    (r) => r.weight_kg !== null && differenceInCalendarDays(new Date(r.log_date), cutoff) >= 0,
  );
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((acc, r) => acc + (r.weight_kg ?? 0), 0);
  return Math.round((sum / inWindow.length) * 10) / 10;
}

type RoutineWithNested = Database["public"]["Tables"]["routines"]["Row"] & {
  routine_exercises: Array<
    Database["public"]["Tables"]["routine_exercises"]["Row"] & {
      exercises: { name: string } | null;
      target_sets: Database["public"]["Tables"]["target_sets"]["Row"][];
    }
  >;
};

async function buildExercisePerformance(
  supabase: SupabaseServerClient,
  routines: RoutineWithNested[],
): Promise<ExercisePerformance[]> {
  const results: ExercisePerformance[] = [];

  for (const routine of routines) {
    for (const re of routine.routine_exercises ?? []) {
      const targetSet = re.target_sets?.[0];

      const { data: loggedSets } = await supabase
        .from("set_logs")
        .select("weight_kg, reps, rpe_actual, completed_at, workout_exercises!inner(exercise_id)")
        .eq("workout_exercises.exercise_id", re.exercise_id)
        .order("completed_at", { ascending: false })
        .limit(6);

      const { data: suggestions } = await supabase
        .from("autoregulation_suggestions")
        .select("suggested_weight_kg, rationale, set_logs!inner(workout_exercises!inner(exercise_id))")
        .eq("set_logs.workout_exercises.exercise_id", re.exercise_id)
        .order("created_at", { ascending: false })
        .limit(3);

      results.push({
        exerciseName: re.exercises?.name ?? "desconocido",
        targetRepsMin: targetSet?.target_reps_min ?? null,
        targetRepsMax: targetSet?.target_reps_max ?? null,
        targetRpe: targetSet?.target_rpe ?? null,
        targetWeightKg: targetSet?.target_weight_kg ?? null,
        loggedSets: (loggedSets ?? []).map((s) => ({
          date: s.completed_at,
          weightKg: s.weight_kg,
          reps: s.reps,
          rpeActual: s.rpe_actual,
        })),
        autoregulationSuggestions: (suggestions ?? []).map((s) => ({
          suggestedWeightKg: s.suggested_weight_kg,
          rationale: s.rationale,
        })),
      });
    }
  }

  return results;
}
