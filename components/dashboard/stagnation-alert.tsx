import { AlertTriangleIcon, ArrowRightIcon, SlidersHorizontalIcon } from "lucide-react";

export interface StagnantExercise {
  exerciseName: string;
  sessionsStagnant: number;
  lastWeightKg: number;
  targetWeightKg: number | null;
}

export function StagnationAlert({ exercises }: { exercises: StagnantExercise[] }) {
  if (exercises.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-destructive/35 bg-card p-container-padding shadow-[0_8px_20px_-12px_rgba(142,77,72,0.7)]">
      <div className="absolute inset-y-0 left-0 w-1 bg-destructive" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 shrink-0 text-destructive" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-destructive">
            Progresión para revisar
          </h2>
        </div>
        <span className="rounded-full bg-destructive/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-destructive">
          {exercises.length} {exercises.length === 1 ? "ejercicio" : "ejercicios"}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Se mantuvieron en la misma carga durante varias sesiones. Revisá técnica, rango de repeticiones y recuperación antes de subir peso.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {exercises.map((ex) => (
          <div
            key={ex.exerciseName}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/70 px-3 py-2.5"
          >
            <div>
              <p className="font-mono text-sm font-medium text-primary">{ex.exerciseName}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {ex.lastWeightKg} kg{ex.targetWeightKg != null && ` · Target ${ex.targetWeightKg} kg`}
              </p>
            </div>
            <span className="flex items-center gap-1 whitespace-nowrap font-mono text-xs font-semibold text-destructive">
              {ex.sessionsStagnant} SESIONES
              <ArrowRightIcon className="size-3.5" />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <SlidersHorizontalIcon className="size-3.5 text-secondary" />
        Ajustá una sola variable por vez para evaluar la respuesta.
      </div>
    </section>
  );
}
