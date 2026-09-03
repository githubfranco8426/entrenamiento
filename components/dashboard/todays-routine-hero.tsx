import { ClockIcon, DumbbellIcon, GaugeIcon, SparklesIcon } from "lucide-react";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";

interface TargetSet {
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rpe: number | null;
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

/** Estimación gruesa: ~2.5 min por serie (trabajo + descanso) para dar una duración orientativa. */
const MINUTES_PER_SET = 2.5;

function effortLabel(avgRpe: number | null): string {
  if (avgRpe == null) return "—";
  if (avgRpe <= 6.5) return "Cómodo";
  if (avgRpe <= 8) return "Moderado";
  return "Exigente";
}

export function TodaysRoutineHero({
  routine,
  daysSinceLastTrained,
  hasActiveMeso,
}: {
  routine: Routine;
  daysSinceLastTrained: number | null;
  hasActiveMeso: boolean;
}) {
  const exercises = [...routine.routine_exercises].sort((a, b) => a.order_index - b.order_index);
  const totalSets = exercises.reduce((sum, re) => sum + re.target_sets.length, 0);
  const rpes = exercises.flatMap((re) => re.target_sets.map((s) => s.target_rpe).filter((r): r is number => r != null));
  const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;
  const estimatedMinutes = totalSets > 0 ? Math.round(totalSets * MINUTES_PER_SET) : null;

  return (
    <section className="relative flex flex-col gap-gutter-md overflow-hidden rounded-xl bg-card p-container-padding ring-1 ring-border">
      <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" />

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
          {hasActiveMeso ? "Recomendada hoy · Adaptada" : "Próxima rutina"}
        </span>
        <SparklesIcon className="size-5 text-secondary" />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-headline-lg font-bold">{routine.title}</h2>
        {routine.day_label && <p className="text-sm text-muted-foreground">{routine.day_label}</p>}
        {daysSinceLastTrained != null && (
          <p className="font-mono text-xs text-destructive">
            Último hit hace {daysSinceLastTrained} día{daysSinceLastTrained === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/60 p-3">
        <div className="flex flex-col items-center gap-0.5 text-center">
          <ClockIcon className="size-5 text-secondary" />
          <span className="font-mono text-sm font-semibold">{estimatedMinutes ? `~${estimatedMinutes} min` : "—"}</span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Duración</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <DumbbellIcon className="size-5 text-primary" />
          <span className="font-mono text-sm font-semibold">{exercises.length} bloques</span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Ejercicios</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <GaugeIcon className="size-5 text-primary" />
          <span className="font-mono text-sm font-semibold">{effortLabel(avgRpe)}</span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Esfuerzo</span>
        </div>
      </div>

      <StartWorkoutButton
        routineId={routine.id}
        size="lg"
        className="w-full gap-2 font-heading text-base font-bold uppercase tracking-wide"
        label="Comenzar rutina de hoy"
      />

      {exercises.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          {exercises.slice(0, 4).map((re, i) => {
            const sets = [...re.target_sets].sort((a, b) => (a.target_reps_max ?? 0) - (b.target_reps_max ?? 0));
            const first = sets[0];
            const repsLabel =
              first?.target_reps_min != null && first?.target_reps_max != null
                ? `${re.target_sets.length}x${first.target_reps_min}-${first.target_reps_max}`
                : `${re.target_sets.length} series`;
            return (
              <div
                key={`${re.exercise_id}-${i}`}
                className="flex items-center gap-3 rounded-lg bg-background/60 p-2.5"
              >
                <ExerciseThumbnail
                  src={re.exercises?.thumbnail_url}
                  alt={re.exercises?.name ?? "Ejercicio"}
                  className="size-11 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{re.exercises?.name ?? "Ejercicio"}</p>
                  <p className="text-xs text-muted-foreground">{re.notes ?? repsLabel}</p>
                </div>
                <span className="whitespace-nowrap font-mono text-xs text-secondary">{repsLabel}</span>
              </div>
            );
          })}
          {exercises.length > 4 && (
            <p className="text-center text-xs text-muted-foreground">+{exercises.length - 4} más</p>
          )}
        </div>
      )}
    </section>
  );
}
