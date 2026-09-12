import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";
import { PeriodizationDecisionSchema } from "@/lib/ai/schema";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ExerciseTarget = {
  exerciseName: string;
  targetSets: number;
  targetRepRangeMin: number;
  targetRepRangeMax: number;
  targetRpe: number;
  targetWeightKg: number | null;
  notes: string | null;
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
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

  if (currentMicrocycle) {
    await supabase.from("microcycles").update({ status: "completed" }).eq("id", currentMicrocycle.id);
  }

  let nextMicrocycle;

  if (decision.phaseTransition.shouldTransition && decision.phaseTransition.toPhase) {
    // El macrociclo completo (todos los mesociclos y sus microciclos) se planifica de antemano —
    // ver design/progresion-meso1-resuelta.md. Por eso acá activamos el próximo mesociclo/microciclo
    // que ya existe con status='planned' en vez de crear uno nuevo.
    await supabase.from("mesocycles").update({ status: "completed" }).eq("id", currentMesocycle.id);

    const { data: nextMesocycle } = await supabase
      .from("mesocycles")
      .select("*")
      .eq("macrocycle_id", currentMesocycle.macrocycle_id)
      .eq("status", "planned")
      .gt("order_index", currentMesocycle.order_index)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextMesocycle) {
      return NextResponse.json(
        {
          error:
            "No hay un próximo mesociclo planificado (status='planned') para activar. Creá uno en Programa antes de aprobar esta transición de fase.",
        },
        { status: 409 },
      );
    }

    await supabase.from("mesocycles").update({ status: "active" }).eq("id", nextMesocycle.id);

    const { data: firstMicro } = await supabase
      .from("microcycles")
      .select("*")
      .eq("mesocycle_id", nextMesocycle.id)
      .order("week_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!firstMicro) {
      return NextResponse.json(
        { error: "El próximo mesociclo no tiene microciclos planificados." },
        { status: 409 },
      );
    }

    await supabase.from("microcycles").update({ status: "active" }).eq("id", firstMicro.id);
    nextMicrocycle = firstMicro;
  } else {
    // Activar el próximo microciclo ya planificado dentro del mismo mesociclo (no crear uno nuevo).
    const { data: planned } = await supabase
      .from("microcycles")
      .select("*")
      .eq("mesocycle_id", currentMesocycle.id)
      .eq("status", "planned")
      .gt("week_number", currentMicrocycle?.week_number ?? 0)
      .order("week_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!planned) {
      return NextResponse.json(
        { error: "No hay un próximo microciclo planificado en este mesociclo para activar." },
        { status: 409 },
      );
    }

    await supabase.from("microcycles").update({ status: "active" }).eq("id", planned.id);
    nextMicrocycle = planned;
  }

  try {
    for (const routineTarget of decision.nextMicrocycleTargets) {
      await reconcileRoutineWithTarget(supabase, user.id, routineTarget);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido aplicando las rutinas del microciclo";
    await supabase
      .from("ai_periodization_runs")
      .update({ status: "error", error_message: message, reviewed_at: new Date().toISOString() })
      .eq("id", runId);
    return NextResponse.json(
      { error: `El microciclo se activó pero falló al aplicar las rutinas: ${message}` },
      { status: 500 },
    );
  }

  const { data: updatedRun, error: updateError } = await supabase
    .from("ai_periodization_runs")
    .update({ status: "applied", applied_at: new Date().toISOString(), reviewed_at: new Date().toISOString() })
    .eq("id", runId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ run: updatedRun, microcycle: nextMicrocycle });
}

/**
 * Las rutinas del usuario (Día A/B/C, Casa — Pierna/Tracción, etc.) son fijas y no están ligadas a
 * un microciclo (microcycle_id null) — se reusan semana a semana. Antes esta función creaba una
 * rutina nueva por cada microciclo aprobado, lo que dejaba "Día A — Empuje" y "Push" conviviendo
 * con contenido duplicado. Ahora busca la rutina existente por day_label y ajusta sus target_sets
 * en el lugar; solo crea rutina/ejercicio nuevos si genuinamente no existen todavía.
 *
 * Cada fallo se propaga (en vez de descartarse en silencio) para que el caller marque el run como
 * "error" con el motivo — antes una adaptación semanal podía "aplicarse" con éxito reportado pese a
 * que routine/routine_exercise/target_sets fallaran a mitad de camino.
 */
async function reconcileRoutineWithTarget(
  supabase: SupabaseServerClient,
  userId: string,
  routineTarget: { dayLabel: string; exercises: ExerciseTarget[] },
) {
  const { data: routine } = await supabase
    .from("routines")
    .select("id, routine_exercises(id, order_index, exercises(name))")
    .ilike("day_label", routineTarget.dayLabel)
    .maybeSingle();

  if (!routine) {
    const { data: newRoutine, error: routineError } = await supabase
      .from("routines")
      .insert({ user_id: userId, title: routineTarget.dayLabel, day_label: routineTarget.dayLabel, order_index: 99 })
      .select("id")
      .single();
    if (routineError || !newRoutine) {
      throw new Error(
        `No se pudo crear la rutina "${routineTarget.dayLabel}": ${routineError?.message ?? "error desconocido"}`,
      );
    }
    for (const [exIndex, exTarget] of routineTarget.exercises.entries()) {
      await createRoutineExercise(supabase, userId, newRoutine.id, exIndex, exTarget);
    }
    return;
  }

  const existingExercises = routine.routine_exercises ?? [];
  let nextOrderIndex =
    existingExercises.length > 0 ? Math.max(...existingExercises.map((re) => re.order_index)) + 1 : 0;

  for (const exTarget of routineTarget.exercises) {
    const match = existingExercises.find(
      (re) => (re.exercises?.name ?? "").trim().toLowerCase() === exTarget.exerciseName.trim().toLowerCase(),
    );

    if (match) {
      await reconcileTargetSets(supabase, userId, match.id, exTarget);
    } else {
      await createRoutineExercise(supabase, userId, routine.id, nextOrderIndex, exTarget);
      nextOrderIndex += 1;
    }
  }
}

async function createRoutineExercise(
  supabase: SupabaseServerClient,
  userId: string,
  routineId: string,
  orderIndex: number,
  exTarget: ExerciseTarget,
) {
  const exerciseId = await findOrCreateExerciseByName(supabase, userId, exTarget.exerciseName);

  const { data: routineExercise, error: routineExerciseError } = await supabase
    .from("routine_exercises")
    .insert({
      user_id: userId,
      routine_id: routineId,
      exercise_id: exerciseId,
      order_index: orderIndex,
      notes: exTarget.notes,
    })
    .select("id")
    .single();

  if (routineExerciseError || !routineExercise) {
    throw new Error(
      `No se pudo agregar "${exTarget.exerciseName}" a la rutina: ${routineExerciseError?.message ?? "error desconocido"}`,
    );
  }

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
    const { error: setsError } = await supabase.from("target_sets").insert(sets);
    if (setsError) {
      throw new Error(`No se pudieron guardar las series de "${exTarget.exerciseName}": ${setsError.message}`);
    }
  }
}

/** Ajusta la cantidad de sets (borra/inserta) y actualiza reps/RPE/peso de un ejercicio existente. */
async function reconcileTargetSets(
  supabase: SupabaseServerClient,
  userId: string,
  routineExerciseId: string,
  exTarget: ExerciseTarget,
) {
  const { data: existingSets, error: existingSetsError } = await supabase
    .from("target_sets")
    .select("id, set_index")
    .eq("routine_exercise_id", routineExerciseId)
    .order("set_index", { ascending: true });

  if (existingSetsError) {
    throw new Error(`No se pudieron leer las series existentes: ${existingSetsError.message}`);
  }

  const current = existingSets ?? [];

  if (current.length > exTarget.targetSets) {
    const toDelete = current.slice(exTarget.targetSets).map((s) => s.id);
    const { error: deleteError } = await supabase.from("target_sets").delete().in("id", toDelete);
    if (deleteError) {
      throw new Error(`No se pudieron quitar series sobrantes de "${exTarget.exerciseName}": ${deleteError.message}`);
    }
  } else if (current.length < exTarget.targetSets) {
    const newRows = Array.from({ length: exTarget.targetSets - current.length }, (_, i) => ({
      user_id: userId,
      routine_exercise_id: routineExerciseId,
      set_index: current.length + i,
      set_type: "normal" as const,
      target_reps_min: exTarget.targetRepRangeMin,
      target_reps_max: exTarget.targetRepRangeMax,
      target_rpe: exTarget.targetRpe,
      target_weight_kg: exTarget.targetWeightKg,
    }));
    const { error: insertError } = await supabase.from("target_sets").insert(newRows);
    if (insertError) {
      throw new Error(`No se pudieron agregar series nuevas de "${exTarget.exerciseName}": ${insertError.message}`);
    }
  }

  const { error: updateError } = await supabase
    .from("target_sets")
    .update({
      target_reps_min: exTarget.targetRepRangeMin,
      target_reps_max: exTarget.targetRepRangeMax,
      target_rpe: exTarget.targetRpe,
      target_weight_kg: exTarget.targetWeightKg,
    })
    .eq("routine_exercise_id", routineExerciseId);

  if (updateError) {
    throw new Error(`No se pudieron actualizar las series de "${exTarget.exerciseName}": ${updateError.message}`);
  }
}

async function findOrCreateExerciseByName(
  supabase: SupabaseServerClient,
  userId: string,
  name: string,
): Promise<string> {
  const { data: existing, error: existingError } = await supabase
    .from("exercises")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`No se pudo buscar el ejercicio "${name}": ${existingError.message}`);
  }
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("exercises")
    .insert({ user_id: userId, name, is_custom: true })
    .select("id")
    .single();

  if (createError || !created) {
    throw new Error(`No se pudo crear el ejercicio "${name}": ${createError?.message ?? "error desconocido"}`);
  }

  return created.id;
}
