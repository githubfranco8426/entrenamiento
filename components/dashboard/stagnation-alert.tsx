import Link from "next/link";
import { AlertTriangleIcon, ArrowRightIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react";

export interface StagnantExercise {
  exerciseName: string;
  sessionsStagnant: number;
  lastWeightKg: number;
  targetWeightKg: number | null;
}

export function StagnationAlert({ exercises }: { exercises: StagnantExercise[] }) {
  if (exercises.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-destructive/35 bg-card p-container-padding shadow-[0_8px_20px_-12px_rgba(142,77,72,0.7)]">
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
        Se mantuvieron en la misma carga durante varias sesiones. Elegí un solo ajuste antes de la próxima sesión para medir la respuesta.
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
      <div className="mt-3 flex flex-col gap-3 rounded-lg bg-destructive/7 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontalIcon className="mt-0.5 size-3.5 shrink-0 text-secondary" />
          <span><strong className="font-semibold text-foreground">Siguiente paso:</strong> sumá una repetición, aplicá una microcarga o reducí una serie.</span>
        </div>
        <Link
          href="/routines"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <PlusIcon className="size-3.5" />
          Agregar corrección
        </Link>
      </div>
    </section>
  );
}
