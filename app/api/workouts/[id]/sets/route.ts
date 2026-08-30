import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SetType } from "@/lib/types/database";

interface LogSetBody {
  exerciseId: string;
  routineExerciseId?: string | null;
  targetSetId?: string | null;
  setIndex: number;
  setType?: SetType;
  weightKg?: number | null;
  reps?: number | null;
  rpeActual?: number | null;
  restSecondsActual?: number | null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_exercises")
    .select("*, exercises(name), set_logs(*)")
    .eq("workout_id", id)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workoutExercises: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workoutId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as LogSetBody;

  // Buscar o crear el workout_exercise para este ejercicio dentro del entrenamiento actual.
  const { data: existing } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_id", workoutId)
    .eq("exercise_id", body.exerciseId)
    .maybeSingle();

  let workoutExerciseId = existing?.id as string | undefined;

  if (!workoutExerciseId) {
    const { count } = await supabase
      .from("workout_exercises")
      .select("id", { count: "exact", head: true })
      .eq("workout_id", workoutId);

    const { data: created, error: createError } = await supabase
      .from("workout_exercises")
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        exercise_id: body.exerciseId,
        routine_exercise_id: body.routineExerciseId ?? null,
        order_index: count ?? 0,
      })
      .select("id")
      .single();

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
    workoutExerciseId = created.id;
  }

  const { data: setLog, error: setError } = await supabase
    .from("set_logs")
    .insert({
      user_id: user.id,
      workout_exercise_id: workoutExerciseId,
      target_set_id: body.targetSetId ?? null,
      set_index: body.setIndex,
      set_type: body.setType ?? "normal",
      weight_kg: body.weightKg ?? null,
      reps: body.reps ?? null,
      rpe_actual: body.rpeActual ?? null,
      rest_seconds_actual: body.restSecondsActual ?? null,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (setError) return NextResponse.json({ error: setError.message }, { status: 500 });
  return NextResponse.json({ setLog }, { status: 201 });
}
