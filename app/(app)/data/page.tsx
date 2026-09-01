import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { WeightChart } from "@/components/data/weight-chart";
import { ProgressionChart } from "@/components/data/progression-chart";

export default async function DataPage() {
  const supabase = await createClient();

  const [{ data: bodyMetrics }, { data: history }] = await Promise.all([
    supabase
      .from("body_metrics")
      .select("log_date, weight_kg")
      .not("weight_kg", "is", null)
      .order("log_date", { ascending: true })
      .limit(90),
    supabase
      .from("workout_exercises")
      .select("exercise_id, exercises(name), set_logs(weight_kg), workouts!inner(started_at, ended_at)")
      .not("workouts.ended_at", "is", null)
      .order("started_at", { referencedTable: "workouts", ascending: true })
      .limit(400),
  ]);

  const weightPoints = (bodyMetrics ?? [])
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ date: m.log_date, weightKg: m.weight_kg as number }));

  const latestWeight = weightPoints.at(-1) ?? null;
  const firstWeight = weightPoints[0] ?? null;
  const weightDelta =
    latestWeight && firstWeight ? Math.round((latestWeight.weightKg - firstWeight.weightKg) * 10) / 10 : null;

  type ExerciseProgress = { name: string; points: { date: string; weightKg: number }[] };
  const progressByExercise = new Map<string, ExerciseProgress>();
  for (const row of history ?? []) {
    const weights = (row.set_logs ?? []).map((s) => s.weight_kg).filter((w): w is number => w != null);
    if (weights.length === 0 || !row.workouts) continue;
    const entry = progressByExercise.get(row.exercise_id) ?? {
      name: row.exercises?.name ?? "Ejercicio",
      points: [],
    };
    entry.points.push({ date: row.workouts.started_at, weightKg: Math.max(...weights) });
    progressByExercise.set(row.exercise_id, entry);
  }

  const topExercises = [...progressByExercise.values()]
    .filter((e) => e.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Mission Control</p>
        <h1 className="font-heading text-xl font-bold">Data</h1>
        <p className="text-sm text-muted-foreground">Peso corporal y progresión de cargas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Peso corporal</CardTitle>
          {latestWeight && (
            <CardDescription className="font-mono text-lg text-foreground">
              {latestWeight.weightKg} kg
              {weightDelta != null && (
                <span className={weightDelta <= 0 ? "text-secondary" : "text-destructive"}>
                  {" "}
                  ({weightDelta > 0 ? "+" : ""}
                  {weightDelta} kg)
                </span>
              )}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <WeightChart points={weightPoints} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Progression Analytics</CardTitle>
          <CardDescription>Carga máxima por sesión, ejercicios con más historial.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {topExercises.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay suficiente historial. Necesitás al menos 2 sesiones registradas del mismo
              ejercicio para ver su progresión acá.
            </p>
          )}
          {topExercises.map((ex) => (
            <div key={ex.name} className="flex flex-col gap-2">
              <p className="font-mono text-xs uppercase tracking-widest text-secondary">{ex.name}</p>
              <ProgressionChart points={ex.points} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
