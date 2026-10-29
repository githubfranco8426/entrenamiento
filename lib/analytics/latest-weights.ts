interface ExerciseSets {
  exercise_id: string;
  set_logs: { weight_kg: number | null; completed_at: string }[] | null;
}

/** One batch of latest sets per workout, reduced to the latest logged load per exercise. */
export function latestWeightByExercise(rows: ExerciseSets[]) {
  const latest = new Map<string, { weight: number; time: number }>();
  for (const row of rows) {
    for (const set of row.set_logs ?? []) {
      if (set.weight_kg == null) continue;
      const time = new Date(set.completed_at).getTime();
      if (!Number.isFinite(time)) continue;
      const previous = latest.get(row.exercise_id);
      if (!previous || time > previous.time) latest.set(row.exercise_id, { weight: set.weight_kg, time });
    }
  }
  return new Map([...latest].map(([id, set]) => [id, set.weight]));
}
