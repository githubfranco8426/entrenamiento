import { cn } from "@/lib/utils";

export interface PlanVsActualRow {
  dayLabel: string;
  exerciseName: string;
  targetWeightKg: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  lastLoggedKg: number | null;
}

export function PlanVsActual({ rows, weekNumber }: { rows: PlanVsActualRow[]; weekNumber: number | null }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay ejercicios con peso objetivo cargado en tus rutinas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {weekNumber != null && (
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Semana {weekNumber}</p>
      )}
      <div className="flex flex-col gap-1.5">
        {rows.map((r, i) => {
          const hasLogged = r.lastLoggedKg != null;
          const onTrack = hasLogged && r.lastLoggedKg! >= r.targetWeightKg;
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.exerciseName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.dayLabel} · Objetivo {r.targetWeightKg}kg
                  {r.targetRepsMin != null && ` · ${r.targetRepsMin}-${r.targetRepsMax} reps`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    !hasLogged ? "text-muted-foreground" : onTrack ? "text-secondary" : "text-destructive",
                  )}
                >
                  {hasLogged ? `${r.lastLoggedKg}kg` : "Sin datos"}
                </span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {!hasLogged
                    ? "todavía no entrenado"
                    : onTrack
                      ? "en objetivo"
                      : `faltan ${(r.targetWeightKg - r.lastLoggedKg!).toFixed(1)}kg`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
