import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estimateOneRepMax } from "@/lib/autoregulation/rpe-tables";
import { WorkoutSession } from "@/components/workouts/workout-session";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: workout, error }, { data: exercises }] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "*, routines(title, day_label, routine_exercises(*, exercises(id, name, plate_increment_kg, thumbnail_url, video_url), target_sets(*))), workout_exercises(*, exercises(id, name, plate_increment_kg, thumbnail_url, video_url), set_logs(*))",
      )
      .eq("id", id)
      .single(),
    supabase.from("exercises").select("id, name, plate_increment_kg, thumbnail_url, video_url").order("name"),
  ]);

  if (error || !workout) notFound();

  const exerciseIds = [
    ...new Set(
      (workout.routines?.routine_exercises ?? [])
        .map((re) => re.exercise_id)
        .concat(workout.workout_exercises.map((we) => we.exercise_id)),
    ),
  ];

  const estimatedOneRepMaxByExercise: Record<string, number> = {};
  if (exerciseIds.length > 0) {
    const { data: history } = await supabase
      .from("set_logs")
      .select("weight_kg, reps, rpe_actual, workout_exercises!inner(exercise_id)")
      .in("workout_exercises.exercise_id", exerciseIds)
      .not("weight_kg", "is", null)
      .not("reps", "is", null)
      .not("rpe_actual", "is", null)
      .limit(500);

    for (const row of history ?? []) {
      if (row.weight_kg == null || row.reps == null || row.rpe_actual == null) continue;
      const exerciseId = row.workout_exercises?.exercise_id;
      if (!exerciseId) continue;
      const e1rm = estimateOneRepMax(row.weight_kg, row.reps, row.rpe_actual);
      if (!estimatedOneRepMaxByExercise[exerciseId] || e1rm > estimatedOneRepMaxByExercise[exerciseId]) {
        estimatedOneRepMaxByExercise[exerciseId] = Math.round(e1rm);
      }
    }
  }

  return (
    <WorkoutSession
      workout={workout}
      allExercises={exercises ?? []}
      estimatedOneRepMaxByExercise={estimatedOneRepMaxByExercise}
    />
  );
}
