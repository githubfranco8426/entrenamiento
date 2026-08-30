import { NextResponse } from "next/server";
import { addDays, formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PeriodizationDecisionSchema } from "@/lib/ai/schema";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: run, error: runError } = await supabase
    .from("ai_periodization_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (runError || !run) return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
  if (run.status !== "pending_review") {
    return NextResponse.json(
      { error: `Esta propuesta ya está en estado '${run.status}'` },
      { status: 409 },
    );
  }

  const parseResult = PeriodizationDecisionSchema.safeParse(run.raw_output);
  if (!parseResult.success) {
    return NextResponse.json({ error: "La propuesta guardada no tiene un formato válido" }, { status: 422 });
  }
  const decision = parseResult.data;

  const { data: currentMesocycle } = await supabase
    .from("mesocycles")
    .select("*")
    .eq("id", run.mesocycle_id ?? "")
    .single();

  if (!currentMesocycle) {
    return NextResponse.json({ error: "No se encontró el mesociclo asociado" }, { status: 404 });
  }

  const { data: currentMicrocycle } = await supabase
    .from("microcycles")
    .select("*")
    .eq("mesocycle_id", currentMesocycle.id)
    .eq("status", "active")
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let targetMesocycleId = currentMesocycle.id;
  let nextWeekNumber = (currentMicrocycle?.week_number ?? 0) + 1;

  if (currentMicrocycle) {
    await supabase.from("microcycles").update({ status: "completed" }).eq("id", currentMicrocycle.id);
  }

  if (decision.phaseTransition.shouldTransition && decision.phaseTransition.toPhase) {
    await supabase.from("mesocycles").update({ status: "completed" }).eq("id", currentMesocycle.id);

    const { data: newMesocycle, error: mesoError } = await supabase
      .from("mesocycles")
      .insert({
        user_id: user.id,
        macrocycle_id: currentMesocycle.macrocycle_id,
        name: `${currentMesocycle.name.replace(/\s*\(.*\)$/, "")} — ${decision.phaseTransition.toPhase}`,
        phase: decision.phaseTransition.toPhase,
        order_index: currentMesocycle.order_index + 1,
        planned_weeks: decision.phaseTransition.isDeloadWeek ? 1 : 4,
        status: "active",
      })
      .select()
      .single();

    if (mesoError) return NextResponse.json({ error: mesoError.message }, { status: 500 });
    targetMesocycleId = newMesocycle.id;
    nextWeekNumber = 1;
  }

  const startDate = currentMicrocycle
    ? addDays(new Date(currentMicrocycle.end_date), 1)
    : new Date();
  const endDate = addDays(startDate, 6);

  const { data: newMicrocycle, error: microError } = await supabase
    .from("microcycles")
    .insert({
      user_id: user.id,
      mesocycle_id: targetMesocycleId,
      week_number: nextWeekNumber,
      start_date: formatISO(startDate, { representation: "date" }),
      end_date: formatISO(endDate, { representation: "date" }),
      is_deload: decision.phaseTransition.isDeloadWeek,
      status: "active",
    })
    .select()
    .single();

  if (microError) return NextResponse.json({ error: microError.message }, { status: 500 });

  for (const [dayIndex, routineTarget] of decision.nextMicrocycleTargets.entries()) {
    await createRoutineFromTarget(supabase, user.id, newMicrocycle.id, dayIndex, routineTarget);
  }

  const { data: updatedRun, error: updateError } = await supabase
    .from("ai_periodization_runs")
    .update({ status: "applied", applied_at: new Date().toISOString(), reviewed_at: new Date().toISOString() })
    .eq("id", runId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ run: updatedRun, microcycle: newMicrocycle });
}

async function createRoutineFromTarget(
  supabase: SupabaseServerClient,
  userId: string,
  microcycleId: string,
  orderIndex: number,
  routineTarget: { dayLabel: string; exercises: Array<{
    exerciseName: string;
    targetSets: number;
    targetRepRangeMin: number;
    targetRepRangeMax: number;
    targetRpe: number;
    targetWeightKg: number | null;
    notes: string | null;
  }> },
) {
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      microcycle_id: microcycleId,
      title: routineTarget.dayLabel,
      day_label: routineTarget.dayLabel,
      order_index: orderIndex,
    })
    .select("id")
    .single();

  if (routineError || !routine) return;

  for (const [exIndex, exTarget] of routineTarget.exercises.entries()) {
    const exerciseId = await findOrCreateExerciseByName(supabase, userId, exTarget.exerciseName);

    const { data: routineExercise } = await supabase
      .from("routine_exercises")
      .insert({
        user_id: userId,
        routine_id: routine.id,
        exercise_id: exerciseId,
        order_index: exIndex,
        notes: exTarget.notes,
      })
      .select("id")
      .single();

    if (!routineExercise) continue;

    const sets = Array.from({ length: exTarget.targetSets }, (_, setIndex) => ({
      user_id: userId,
      routine_exercise_id: routineExercise.id,
      set_index: setIndex,
      set_type: "normal" as const,
      target_reps_min: exTarget.targetRepRangeMin,
      target_reps_max: exTarget.targetRepRangeMax,
      target_rpe: exTarget.targetRpe,
      target_weight_kg: exTarget.targetWeightKg,
    }));

    if (sets.length > 0) {
      await supabase.from("target_sets").insert(sets);
    }
  }
}

async function findOrCreateExerciseByName(
  supabase: SupabaseServerClient,
  userId: string,
  name: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from("exercises")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("exercises")
    .insert({ user_id: userId, name, is_custom: true })
    .select("id")
    .single();

  return created!.id;
}
