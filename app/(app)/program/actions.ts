"use server";

import { addDays, formatISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";

type TargetPrescription = {
  routineExerciseId: string;
  targetSets: number;
  repsMin: number;
  repsMax: number;
  targetRpe: number | null;
  targetWeightKg: number | null;
};

// Meso 1 — Romper estancamiento: la quinta semana es la descarga acordada.
// `target_rpe` representa RPE, por eso RIR 4 se guarda como RPE 6.
const WEEK_FIVE_DELOAD_TARGETS: TargetPrescription[] = [
  { routineExerciseId: "02c0f8e5-af4a-4170-abd9-e84021874dfb", targetSets: 3, repsMin: 8, repsMax: 8, targetRpe: 6, targetWeightKg: 55 },
  { routineExerciseId: "3bded941-62cc-480c-9c88-dfd825b44b7a", targetSets: 2, repsMin: 10, repsMax: 10, targetRpe: 6, targetWeightKg: 15 },
  { routineExerciseId: "e603c4db-43c1-413b-9ff7-a2f30b5dec9a", targetSets: 2, repsMin: 10, repsMax: 10, targetRpe: 6, targetWeightKg: 15 },
  { routineExerciseId: "986f161c-4897-438d-9aa9-5908bce725c1", targetSets: 3, repsMin: 10, repsMax: 10, targetRpe: 6, targetWeightKg: 17.5 },
  { routineExerciseId: "7bd027b4-c2f2-4490-85de-4911c303aacb", targetSets: 3, repsMin: 10, repsMax: 10, targetRpe: 6, targetWeightKg: 17.5 },
  { routineExerciseId: "3fbedd54-8367-4220-a3b1-9a5eeca08a4b", targetSets: 3, repsMin: 12, repsMax: 12, targetRpe: 6, targetWeightKg: 40 },
  { routineExerciseId: "9765e9a2-708d-4f4f-8c02-18b88593d142", targetSets: 3, repsMin: 10, repsMax: 10, targetRpe: 6, targetWeightKg: 16 },
  { routineExerciseId: "1daf3a40-18aa-40ff-a48f-ddca38b01846", targetSets: 3, repsMin: 12, repsMax: 12, targetRpe: 6, targetWeightKg: 45 },
];

export async function advanceMicrocycle(formData: FormData) {
  const mesocycleId = formData.get("mesocycleId");
  if (typeof mesocycleId !== "string" || !mesocycleId) throw new Error("Mesociclo inválido");

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) throw new Error("No autenticado");

  const { data: mesocycle, error: mesocycleError } = await supabase
    .from("mesocycles")
    .select("planned_weeks")
    .eq("id", mesocycleId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (mesocycleError) throw new Error(mesocycleError.message);
  if (!mesocycle) throw new Error("No encontré el mesociclo activo");

  const { data: activeMicrocycle, error: activeMicrocycleError } = await supabase
    .from("microcycles")
    .select("id, week_number, end_date")
    .eq("mesocycle_id", mesocycleId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (activeMicrocycleError) throw new Error(activeMicrocycleError.message);
  if (!activeMicrocycle) throw new Error("No hay una semana activa para avanzar");
  if (activeMicrocycle.week_number >= mesocycle.planned_weeks) {
    throw new Error("Este mesociclo ya está en su última semana");
  }

  const { data: plannedNext, error: plannedNextError } = await supabase.from("microcycles").select("id").eq("mesocycle_id", mesocycleId).eq("user_id", user.id).eq("week_number", activeMicrocycle.week_number + 1).eq("status", "planned").maybeSingle();
  if (plannedNextError) throw new Error(plannedNextError.message);
  const nextStart = addDays(new Date(`${activeMicrocycle.end_date}T00:00:00`), 1);
  const { error: completeError } = await supabase
    .from("microcycles")
    .update({ status: "completed" })
    .eq("id", activeMicrocycle.id)
    .eq("user_id", user.id);
  if (completeError) throw new Error(completeError.message);

  const { error: nextMicrocycleError } = plannedNext
    ? await supabase.from("microcycles").update({ status: "active" }).eq("id", plannedNext.id).eq("user_id", user.id)
    : await supabase.from("microcycles").insert({
    user_id: user.id,
    mesocycle_id: mesocycleId,
    week_number: activeMicrocycle.week_number + 1,
    start_date: formatISO(nextStart, { representation: "date" }),
    end_date: formatISO(addDays(nextStart, 6), { representation: "date" }),
    status: "active",
  });
  if (nextMicrocycleError) throw new Error(nextMicrocycleError.message);

  revalidatePath("/routines");
  revalidatePath("/dashboard");
  revalidatePath("/program");
  revalidatePath("/calendar");
  revalidatePath("/data");
}

export async function applyWeekFiveDeload(formData: FormData) {
  const mesocycleId = formData.get("mesocycleId");
  if (typeof mesocycleId !== "string" || !mesocycleId) throw new Error("Mesociclo inválido");

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) throw new Error("No autenticado");

  const { data: activeMicrocycle, error: activeMicrocycleError } = await supabase
    .from("microcycles")
    .select("id, week_number")
    .eq("mesocycle_id", mesocycleId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (activeMicrocycleError) throw new Error(activeMicrocycleError.message);
  if (!activeMicrocycle || activeMicrocycle.week_number !== 5) {
    throw new Error("La descarga solo se puede aplicar con la semana 5 activa");
  }

  const { data: ownedExercises, error: ownedExercisesError } = await supabase
    .from("routine_exercises")
    .select("id")
    .eq("user_id", user.id)
    .in(
      "id",
      WEEK_FIVE_DELOAD_TARGETS.map((target) => target.routineExerciseId),
    );
  if (ownedExercisesError) throw new Error(ownedExercisesError.message);

  const ownedExerciseIds = new Set((ownedExercises ?? []).map((exercise) => exercise.id));
  if (ownedExerciseIds.size !== WEEK_FIVE_DELOAD_TARGETS.length) {
    throw new Error("No encontré todas las prescripciones de Meso 1 para aplicar la descarga");
  }

  for (const target of WEEK_FIVE_DELOAD_TARGETS) {
    await reconcileTargetSets(supabase, user.id, target);
  }

  const { data: plankExercises, error: plankExercisesError } = await supabase
    .from("routine_exercises")
    .select("id, exercises!inner(name), routines!inner(day_label)")
    .eq("user_id", user.id)
    .eq("exercises.name", "Plancha")
    .ilike("routines.day_label", "HOME%");
  if (plankExercisesError) throw new Error(plankExercisesError.message);

  for (const plank of plankExercises ?? []) {
    await reconcileTargetSets(supabase, user.id, {
      routineExerciseId: plank.id,
      targetSets: 2,
      repsMin: 30,
      repsMax: 30,
      targetRpe: null,
      targetWeightKg: null,
    });
  }

  const { error: deloadError } = await supabase
    .from("microcycles")
    .update({ is_deload: true })
    .eq("id", activeMicrocycle.id)
    .eq("user_id", user.id);
  if (deloadError) throw new Error(deloadError.message);

  revalidatePath("/dashboard");
  revalidatePath("/program");
  revalidatePath("/routines");
  revalidatePath("/calendar");
  revalidatePath("/data");
}

async function reconcileTargetSets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  target: TargetPrescription,
) {
  const { data: existingSets, error: existingSetsError } = await supabase
    .from("target_sets")
    .select("id")
    .eq("routine_exercise_id", target.routineExerciseId)
    .eq("user_id", userId)
    .order("set_index", { ascending: true });
  if (existingSetsError) throw new Error(existingSetsError.message);

  const current = existingSets ?? [];
  if (current.length > target.targetSets) {
    const { error } = await supabase
      .from("target_sets")
      .delete()
      .in(
        "id",
        current.slice(target.targetSets).map((set) => set.id),
      );
    if (error) throw new Error(error.message);
  }

  if (current.length < target.targetSets) {
    const { error } = await supabase.from("target_sets").insert(
      Array.from({ length: target.targetSets - current.length }, (_, index) => ({
        user_id: userId,
        routine_exercise_id: target.routineExerciseId,
        set_index: current.length + index,
        set_type: "normal" as const,
        target_reps_min: target.repsMin,
        target_reps_max: target.repsMax,
        target_rpe: target.targetRpe,
        target_weight_kg: target.targetWeightKg,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const { error: updateError } = await supabase
    .from("target_sets")
    .update({
      target_reps_min: target.repsMin,
      target_reps_max: target.repsMax,
      target_rpe: target.targetRpe,
      target_weight_kg: target.targetWeightKg,
    })
    .eq("routine_exercise_id", target.routineExerciseId)
    .eq("user_id", userId);
  if (updateError) throw new Error(updateError.message);
}
