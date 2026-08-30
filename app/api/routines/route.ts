import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface TargetSetInput {
  setIndex: number;
  setType?: string;
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
  targetRpe?: number | null;
  targetWeightKg?: number | null;
  restSeconds?: number | null;
}

interface RoutineExerciseInput {
  exerciseId: string;
  orderIndex: number;
  notes?: string | null;
  targetSets: TargetSetInput[];
}

interface CreateRoutineBody {
  title: string;
  dayLabel?: string | null;
  microcycleId?: string | null;
  orderIndex?: number;
  exercises: RoutineExerciseInput[];
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("routines")
    .select(
      "*, routine_exercises(*, exercises(name), target_sets(*))",
    )
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ routines: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as CreateRoutineBody;

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      user_id: user.id,
      title: body.title,
      day_label: body.dayLabel ?? null,
      microcycle_id: body.microcycleId ?? null,
      order_index: body.orderIndex ?? 0,
    })
    .select()
    .single();

  if (routineError) return NextResponse.json({ error: routineError.message }, { status: 500 });

  for (const ex of body.exercises) {
    const { data: routineExercise, error: reError } = await supabase
      .from("routine_exercises")
      .insert({
        user_id: user.id,
        routine_id: routine.id,
        exercise_id: ex.exerciseId,
        order_index: ex.orderIndex,
        notes: ex.notes ?? null,
      })
      .select("id")
      .single();

    if (reError) return NextResponse.json({ error: reError.message }, { status: 500 });

    if (ex.targetSets.length > 0) {
      const { error: setsError } = await supabase.from("target_sets").insert(
        ex.targetSets.map((s) => ({
          user_id: user.id,
          routine_exercise_id: routineExercise.id,
          set_index: s.setIndex,
          set_type: (s.setType as never) ?? "normal",
          target_reps_min: s.targetRepsMin ?? null,
          target_reps_max: s.targetRepsMax ?? null,
          target_rpe: s.targetRpe ?? null,
          target_weight_kg: s.targetWeightKg ?? null,
          rest_seconds: s.restSeconds ?? null,
        })),
      );
      if (setsError) return NextResponse.json({ error: setsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ routine }, { status: 201 });
}
