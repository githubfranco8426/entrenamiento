import Link from "next/link";
import {
  format,
  startOfISOWeek,
  endOfISOWeek,
  eachDayOfInterval,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { SettingsIcon, SparklesIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { shiftTypeForDate } from "@/lib/utils/shift-pattern";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ReadinessQuickCheckin } from "@/components/dashboard/readiness-quick-checkin";
import { BodyMetricForm } from "@/components/dashboard/body-metric-form";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { TodaysRoutineHero } from "@/components/dashboard/todays-routine-hero";
import { WeeklyActivity } from "@/components/dashboard/weekly-activity";
import { WeeklyVolume } from "@/components/dashboard/weekly-volume";
import { StagnationAlert, type StagnantExercise } from "@/components/dashboard/stagnation-alert";
import { DeleteButton } from "@/components/ui/delete-button";

const PHASE_LABELS: Record<string, string> = {
  acumulacion: "Acumulación",
  intensificacion: "Intensificación",
  deload: "Deload",
  realizacion: "Realización",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfISOWeek(new Date()), "yyyy-MM-dd'T'00:00:00");
  const weekEnd = format(endOfISOWeek(new Date()), "yyyy-MM-dd'T'23:59:59");

  const [
    { data: settings },
    { data: readiness },
    { data: bodyMetric },
    { data: routines },
    { data: workouts },
    { data: activeMeso },
    { data: weekSets },
  ] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("readiness_logs").select("*").eq("log_date", today).maybeSingle(),
    supabase.from("body_metrics").select("*").eq("log_date", today).maybeSingle(),
    supabase
      .from("routines")
      .select(
        "id, title, day_label, routine_exercises(exercise_id, order_index, notes, exercises(name, thumbnail_url), target_sets(set_index, target_reps_min, target_reps_max, target_rpe, target_weight_kg))",
      )
      .order("order_index"),
    supabase
      .from("workouts")
      .select("id, routine_id, started_at, ended_at, routines(title, day_label)")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase.from("mesocycles").select("*, microcycles(*)").eq("status", "active").maybeSingle(),
    supabase
      .from("set_logs")
      .select("completed_at, workout_exercises(exercises(muscle_group))")
      .gte("completed_at", weekStart)
      .lte("completed_at", weekEnd),
  ]);

  const { data: weekWorkouts } = await supabase
    .from("workouts")
    .select("started_at")
    .gte("started_at", weekStart)
    .lte("started_at", weekEnd);

  const weekDays = eachDayOfInterval({ start: startOfISOWeek(new Date()), end: endOfISOWeek(new Date()) });
  const trainedDates = (weekWorkouts ?? []).map((w) => new Date(w.started_at));

  const defaultShiftType = settings?.shift_anchor_date
    ? shiftTypeForDate(new Date(today), new Date(settings.shift_anchor_date))
    : "dia4_libre";

  const activeMicro = (activeMeso?.microcycles ?? []).find((m) => m.status === "active");

  const lastTrainedByRoutine = new Map<string, string>();
  for (const w of workouts ?? []) {
    if (w.routine_id && !lastTrainedByRoutine.has(w.routine_id)) {
      lastTrainedByRoutine.set(w.routine_id, w.started_at);
    }
  }
  const nextRoutine = [...(routines ?? [])].sort((a, b) => {
    const da = lastTrainedByRoutine.get(a.id);
    const db = lastTrainedByRoutine.get(b.id);
    if (!da && !db) return 0;
    if (!da) return -1;
    if (!db) return 1;
    return da.localeCompare(db);
  })[0];

  const daysSinceLastTrained = nextRoutine
    ? (() => {
        const last = lastTrainedByRoutine.get(nextRoutine.id);
        return last ? differenceInCalendarDays(new Date(), new Date(last)) : null;
      })()
    : null;

  const nextExerciseIds = [
    ...new Set((nextRoutine?.routine_exercises ?? []).map((re) => re.exercise_id)),
  ];

  const stagnantExercises: StagnantExercise[] = [];
  if (nextExerciseIds.length > 0) {
    const { data: history } = await supabase
      .from("workout_exercises")
      .select("exercise_id, workout_id, set_logs(weight_kg), workouts!inner(started_at, ended_at)")
      .in("exercise_id", nextExerciseIds)
      .not("workouts.ended_at", "is", null)
      .order("started_at", { referencedTable: "workouts", ascending: false })
      .limit(60);

    type Session = { startedAt: string; maxWeight: number };
    const sessionsByExercise = new Map<string, Session[]>();
    for (const row of history ?? []) {
      const weights = (row.set_logs ?? [])
        .map((s) => s.weight_kg)
        .filter((w): w is number => w != null);
      if (weights.length === 0 || !row.workouts) continue;
      const maxWeight = Math.max(...weights);
      const list = sessionsByExercise.get(row.exercise_id) ?? [];
      list.push({ startedAt: row.workouts.started_at, maxWeight });
      sessionsByExercise.set(row.exercise_id, list);
    }

    for (const re of nextRoutine?.routine_exercises ?? []) {
      const sessions = (sessionsByExercise.get(re.exercise_id) ?? []).sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt),
      );
      if (sessions.length < 2) continue;

      let streak = 1;
      for (let i = 0; i < sessions.length - 1; i++) {
        if (sessions[i].maxWeight <= sessions[i + 1].maxWeight) streak++;
        else break;
      }
      if (streak < 2) continue;

      const targetSets = [...(re.target_sets ?? [])].sort((a, b) => a.set_index - b.set_index);
      stagnantExercises.push({
        exerciseName: re.exercises?.name ?? "Ejercicio",
        sessionsStagnant: streak,
        lastWeightKg: sessions[0].maxWeight,
        targetWeightKg: targetSets[0]?.target_weight_kg ?? null,
      });
    }
  }

  const volumeMap = new Map<string, number>();
  for (const s of weekSets ?? []) {
    const group = s.workout_exercises?.exercises?.muscle_group ?? "Sin clasificar";
    volumeMap.set(group, (volumeMap.get(group) ?? 0) + 1);
  }
  const volumeByMuscle = [...volumeMap.entries()].sort((a, b) => b[1] - a[1]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-col gap-gutter-lg">
      <div className="flex flex-col gap-gutter-sm pt-2">
        <div className="flex items-center justify-between">
          {activeMeso ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-primary">
              <SparklesIcon className="size-4" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                Adaptación inteligente activa
              </span>
            </div>
          ) : (
            <span />
          )}
          <Link
            href="/settings"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <SettingsIcon className="size-4" />
            <span className="sr-only">Ajustes</span>
          </Link>
        </div>
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">{greeting} 👋</h1>
          <p className="text-headline-sm text-muted-foreground">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            {activeMeso &&
              ` · ${PHASE_LABELS[activeMeso.phase] ?? activeMeso.phase}${activeMicro?.is_deload ? " (Descarga)" : ""}${activeMicro ? ` · Semana ${activeMicro.week_number}` : ""}`}
          </p>
        </div>
      </div>

      <StagnationAlert exercises={stagnantExercises} />

      <ReadinessQuickCheckin
        today={today}
        defaultShiftType={defaultShiftType}
        initial={readiness ?? null}
        aiNote={
          nextRoutine
            ? `Basado en tu readiness: seguimos con "${nextRoutine.title}" tal como está planificada.`
            : null
        }
      />

      {nextRoutine ? (
        <TodaysRoutineHero
          routine={nextRoutine}
          daysSinceLastTrained={daysSinceLastTrained}
          hasActiveMeso={!!activeMeso}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay rutinas. Creá una en{" "}
          <Link href="/routines" className="text-primary underline underline-offset-2">
            Rutinas
          </Link>
          .
        </p>
      )}

      <WeeklyActivity weekDays={weekDays} trainedDates={trainedDates} />

      {!activeMeso && (
        <p className="text-sm text-muted-foreground">
          No hay un mesociclo activo. Activá uno en{" "}
          <Link href="/program" className="text-primary underline underline-offset-2">
            Programa
          </Link>
          .
        </p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="border-b border-border pb-2 font-heading text-base font-bold uppercase tracking-wide text-primary">
          Volumen semanal
        </h2>
        <WeeklyVolume volumeByMuscle={volumeByMuscle} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peso corporal</CardTitle>
          </CardHeader>
          <CardContent>
            <BodyMetricForm today={today} initial={bodyMetric ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Todas las rutinas</CardTitle>
            <CardDescription>Iniciá un entrenamiento desde cualquier rutina, o uno libre.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(routines ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay rutinas. Creá una en{" "}
                <Link href="/routines" className="underline">
                  Rutinas
                </Link>
                .
              </p>
            )}
            {(routines ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.day_label && <p className="text-xs text-muted-foreground">{r.day_label}</p>}
                </div>
                <StartWorkoutButton routineId={r.id} />
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <StartWorkoutButton />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos entrenamientos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(workouts ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no registraste ningún entrenamiento.</p>
          )}
          {(workouts ?? []).map((w) => (
            <div key={w.id} className="flex items-center gap-2">
              <Link
                href={`/workouts/${w.id}`}
                className="flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{w.routines?.title ?? "Entreno libre"}</span>
                <span className="font-mono text-muted-foreground">
                  {format(new Date(w.started_at), "dd/MM/yyyy HH:mm")}
                  {!w.ended_at && " · en curso"}
                </span>
              </Link>
              <DeleteButton
                endpoint={`/api/workouts/${w.id}`}
                confirmMessage={`¿Borrar el entrenamiento "${w.routines?.title ?? "Entreno libre"}" del ${format(new Date(w.started_at), "dd/MM/yyyy")}? Esta acción no se puede deshacer.`}
                successMessage="Entrenamiento borrado"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
