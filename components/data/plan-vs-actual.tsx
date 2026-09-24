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

  const groups = rows.reduce<Map<string, PlanVsActualRow[]>>((map, row) => {
    map.set(row.dayLabel, [...(map.get(row.dayLabel) ?? []), row]);
    return map;
  }, new Map());

  return (
    <div className="flex flex-col gap-3">
      {weekNumber != null && (
        <p className="w-fit rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Semana {weekNumber}
        </p>
      )}
      {[...groups.entries()].map(([dayLabel, groupRows], groupIndex) => {
        const readyCount = groupRows.filter((r) => r.lastLoggedKg != null && r.lastLoggedKg >= r.targetWeightKg).length;

        return (
          <details key={dayLabel} open={groupIndex === 0} className="group rounded-xl border border-border bg-muted/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 marker:content-none">
              <div>
                <p className="font-heading text-sm font-bold">{dayLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {readyCount}/{groupRows.length} ejercicios en objetivo
                </p>
              </div>
              <span className="rounded-full bg-card px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-secondary transition-transform group-open:rotate-180">
                Ver
              </span>
            </summary>
            <div className="flex flex-col gap-1.5 border-t border-border px-2 pb-2 pt-2">
              {groupRows.map((r, i) => {
                const hasLogged = r.lastLoggedKg != null;
                const onTrack = hasLogged && r.lastLoggedKg! >= r.targetWeightKg;
                return (
                  <div key={`${r.exerciseName}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.exerciseName}</p>
                      <p className="text-xs text-muted-foreground">
                        Objetivo {r.targetWeightKg} kg
                        {r.targetRepsMin != null && ` · ${r.targetRepsMin}-${r.targetRepsMax} reps`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className={cn("font-mono text-sm font-bold", !hasLogged ? "text-muted-foreground" : onTrack ? "text-secondary" : "text-destructive")}>
                        {hasLogged ? `${r.lastLoggedKg} kg` : "—"}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {!hasLogged ? "sin registro" : onTrack ? "en objetivo" : `faltan ${(r.targetWeightKg - r.lastLoggedKg!).toFixed(1)} kg`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
