import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutSession } from "@/components/workouts/workout-session";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: workout, error }, { data: exercises }] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "*, routines(title, day_label, routine_exercises(*, exercises(id, name, plate_increment_kg), target_sets(*))), workout_exercises(*, exercises(id, name, plate_increment_kg), set_logs(*))",
      )
      .eq("id", id)
      .single(),
    supabase.from("exercises").select("id, name, plate_increment_kg").order("name"),
  ]);

  if (error || !workout) notFound();

  return <WorkoutSession workout={workout} allExercises={exercises ?? []} />;
}
