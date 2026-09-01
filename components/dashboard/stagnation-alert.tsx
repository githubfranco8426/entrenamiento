import { AlertTriangleIcon, ArrowRightIcon } from "lucide-react";

export interface StagnantExercise {
  exerciseName: string;
  sessionsStagnant: number;
  lastWeightKg: number;
  targetWeightKg: number | null;
}

export function StagnationAlert({ exercises }: { exercises: StagnantExercise[] }) {
  if (exercises.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4">
      <div className="absolute inset-y-0 left-0 w-1 bg-destructive" />
      <div className="flex items-center gap-2">
        <AlertTriangleIcon className="size-4 shrink-0 text-destructive" />
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-destructive">
          Estancamiento detectado
        </h2>
      </div>
      <p className="mt-2 text-sm text-foreground">
        Estos movimientos llevan varias sesiones sin subir peso. Forzar sobrecarga en la próxima sesión.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {exercises.map((ex) => (
          <div
            key={ex.exerciseName}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
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
    </div>
  );
}
