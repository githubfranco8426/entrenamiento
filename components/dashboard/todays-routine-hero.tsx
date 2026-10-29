import { ClockIcon, GaugeIcon } from "lucide-react";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";

interface TargetSet {
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rpe: number | null;
  target_weight_kg: number | null;
}
interface RoutineExercise {
  exercise_id: string;
  order_index: number;
  notes: string | null;
  exercises: { name: string; thumbnail_url: string | null } | null;
  target_sets: TargetSet[];
}
interface Routine {
  id: string;
  title: string;
  day_label: string | null;
  routine_exercises: RoutineExercise[];
}

export function TodaysRoutineHero({ routine, daysSinceLastTrained, hasActiveMeso }: {
  routine: Routine;
  daysSinceLastTrained: number | null;
  hasActiveMeso: boolean;
}) {
  const exercises = [...routine.routine_exercises].sort((a, b) => a.order_index - b.order_index);
  const totalSets = exercises.reduce((sum, re) => sum + re.target_sets.length, 0);
  const rpes = exercises.flatMap((re) => re.target_sets.map((s) => s.target_rpe).filter((r): r is number => r != null));
  const avgRpe = rpes.length ? rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length : null;
  const estimatedMinutes = totalSets ? Math.round(totalSets * 2.5) : null;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-(--shadow-panel)">
      <div className="grid md:grid-cols-2">
        <div className="flex min-w-0 flex-col p-4 sm:p-6 md:border-r md:border-border">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{hasActiveMeso ? "Sesión programada" : "Próxima sesión"}</p>
            <span className="rounded bg-muted px-2 py-1 text-[10px] font-semibold uppercase text-secondary">{routine.day_label ?? "Entrenamiento"}</span>
          </div>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{routine.title}</h2>
          {daysSinceLastTrained != null && <p className="mt-2 text-xs text-muted-foreground">Última sesión hace {daysSinceLastTrained} día{daysSinceLastTrained === 1 ? "" : "s"}</p>}
          <div className="my-5 grid grid-cols-2 gap-3 rounded-md bg-muted p-3">
            <div className="flex items-center gap-2.5">
              <ClockIcon className="size-4 text-secondary" />
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Duración estimada</p><p className="mt-1 text-sm font-semibold">{estimatedMinutes ? `~${estimatedMinutes} min` : "—"}</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <GaugeIcon className="size-4 text-secondary" />
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">RIR medio objetivo</p><p className="mt-1 text-sm font-semibold">{avgRpe == null ? "—" : (10 - avgRpe).toFixed(1)}</p></div>
            </div>
          </div>
          <StartWorkoutButton routineId={routine.id} size="lg" className="mt-auto w-full gap-2 rounded-md text-sm font-semibold uppercase tracking-wide" label="Iniciar entrenamiento" />
        </div>
        <div className="min-w-0 border-t border-border p-4 sm:p-6 md:border-t-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ejercicios principales</p>
            <span className="text-xs text-muted-foreground">{totalSets} series</span>
          </div>
          <div className="flex flex-col gap-2">
            {exercises.slice(0, 3).map((re, i) => {
              const first = re.target_sets[0];
              const reps = first?.target_reps_min != null ? `${first.target_reps_min}${first.target_reps_max != null && first.target_reps_max !== first.target_reps_min ? `–${first.target_reps_max}` : ""}` : "—";
              return (
                <div key={`${re.exercise_id}-${i}`} className="flex items-center gap-3 rounded-md bg-muted/70 p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded bg-accent text-xs font-semibold text-secondary">{i + 1}</span>
                  <p className="min-w-0 flex-1 text-sm font-medium">{re.exercises?.name ?? "Ejercicio"}</p>
                  <div className="shrink-0 text-right text-xs"><p className="font-semibold">{re.target_sets.length} × {reps}</p><p className="mt-1 text-muted-foreground">{first?.target_weight_kg != null ? `${first.target_weight_kg} kg` : "Sin carga indicada"}</p></div>
                </div>
              );
            })}
          </div>
          {exercises.length > 3 && <p className="mt-3 text-xs text-muted-foreground">+{exercises.length - 3} ejercicios en la sesión</p>}
        </div>
      </div>
    </section>
  );
}
