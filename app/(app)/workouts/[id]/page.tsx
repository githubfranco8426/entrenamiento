import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estimateOneRepMax } from "@/lib/autoregulation/rpe-tables";
import { computeAcwr, type DailyLoad } from "@/lib/analytics/acwr";
import { pickNextRoutine } from "@/lib/utils/next-routine";
import { WorkoutSession } from "@/components/workouts/workout-session";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: workout, error }, { data: exercises }] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "*, routines(title, day_label, routine_exercises(*, exercises(id, name, plate_increment_kg, thumbnail_url, video_url, cues, biomechanics_notes), target_sets(*))), workout_exercises(*, exercises(id, name, plate_increment_kg, thumbnail_url, video_url, cues, biomechanics_notes), set_logs(*))",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("exercises")
      .select("id, name, plate_increment_kg, thumbnail_url, video_url, cues, biomechanics_notes")
      .order("name"),
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

  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
  twentyEightDaysAgo.setHours(0, 0, 0, 0);
  const { data: acwrSets } = await supabase
    .from("set_logs")
    .select("weight_kg, reps, completed_at")
    .not("weight_kg", "is", null)
    .not("reps", "is", null)
    .gte("completed_at", twentyEightDaysAgo.toISOString())
    .limit(2000);

  const loadByDay = new Map<string, number>();
  for (const s of acwrSets ?? []) {
    const day = s.completed_at.slice(0, 10);
    loadByDay.set(day, (loadByDay.get(day) ?? 0) + (s.weight_kg ?? 0) * (s.reps ?? 0));
  }
  const dailyLoads: DailyLoad[] = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, load: loadByDay.get(key) ?? 0 };
  });
  const acwr = computeAcwr(dailyLoads);

  const [{ data: liveRoutines }, { data: recentWorkouts }] = await Promise.all([
    supabase.from("routines").select("id, title, day_label").is("microcycle_id", null),
    supabase.from("workouts").select("routine_id, started_at").order("started_at", { ascending: false }).limit(5),
  ]);
  const nextRoutine = pickNextRoutine(liveRoutines ?? [], recentWorkouts ?? []);
  const nextRoutineLabel = nextRoutine ? (nextRoutine.day_label ?? nextRoutine.title) : null;

  return (
    <WorkoutSession
      workout={workout}
      allExercises={exercises ?? []}
      estimatedOneRepMaxByExercise={estimatedOneRepMaxByExercise}
      acwr={acwr.ratio != null ? { ratio: acwr.ratio, zone: acwr.zone } : null}
      nextRoutineLabel={nextRoutineLabel}
    />
  );
}
