import { differenceInMinutes } from "date-fns";
import { ClockIcon, LayersIcon, TrendingUpIcon, GaugeIcon, ActivityIcon, CalendarClockIcon } from "lucide-react";
import { repsInReserve } from "@/lib/autoregulation/rpe-tables";
import { ACWR_ZONE_LABELS, type AcwrZone } from "@/lib/analytics/acwr";
import { cn } from "@/lib/utils";

interface SetLog {
  weight_kg: number | null;
  reps: number | null;
  rpe_actual: number | null;
}

interface SummaryBlock {
  exerciseName: string;
  loggedSets: SetLog[];
  estimatedOneRepMaxKg: number | null;
}

const ACWR_ZONE_STYLES: Record<AcwrZone, string> = {
  undertraining: "bg-secondary/15 text-secondary",
  optimo: "bg-primary/15 text-primary",
  precaucion: "bg-tertiary/15 text-tertiary",
  riesgo: "bg-destructive/15 text-destructive",
};

/** Informe post-sesión: derivado enteramente de datos ya registrados, sin métricas inventadas. */
export function WorkoutSummary({
  startedAt,
  endedAt,
  blocks,
  acwr,
  nextRoutineLabel,
}: {
  startedAt: string;
  endedAt: string;
  blocks: SummaryBlock[];
  acwr?: { ratio: number; zone: AcwrZone | null } | null;
  nextRoutineLabel?: string | null;
}) {
  const durationMin = differenceInMinutes(new Date(endedAt), new Date(startedAt));
  const allSets = blocks.flatMap((b) => b.loggedSets);
  const totalSets = allSets.length;
  const totalVolumeKg = allSets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
  const rpes = allSets.map((s) => s.rpe_actual).filter((r): r is number => r != null);
  const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;
  const avgRir = avgRpe != null ? Math.round(repsInReserve(avgRpe) * 10) / 10 : null;

  if (totalSets === 0) return null;

  return (
    <section className="flex flex-col gap-gutter-md rounded-xl bg-card p-container-padding ring-1 ring-border shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_20px_-8px_rgba(0,0,0,0.6)]">
      <h2 className="font-heading text-headline-md font-bold">Informe post-sesión</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryStat icon={ClockIcon} label="Duración" value={`${durationMin} min`} />
        <SummaryStat icon={LayersIcon} label="Series" value={String(totalSets)} />
        <SummaryStat icon={TrendingUpIcon} label="Volumen" value={`${Math.round(totalVolumeKg).toLocaleString("es")} kg`} />
        <SummaryStat icon={GaugeIcon} label="RIR promedio" value={avgRir != null ? String(avgRir) : "—"} />
      </div>

      {acwr && acwr.zone && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-foreground">Carga de entrenamiento (ACWR)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold">{acwr.ratio.toFixed(2)}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
                ACWR_ZONE_STYLES[acwr.zone],
              )}
            >
              {ACWR_ZONE_LABELS[acwr.zone]}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Por ejercicio
        </p>
        {blocks
          .filter((b) => b.loggedSets.length > 0)
          .map((b) => {
            const bestSet = [...b.loggedSets].sort(
              (a, b2) => (b2.weight_kg ?? 0) * (b2.reps ?? 0) - (a.weight_kg ?? 0) * (a.reps ?? 0),
            )[0];
            return (
              <div key={b.exerciseName} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{b.exerciseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.loggedSets.length} serie{b.loggedSets.length === 1 ? "" : "s"}
                    {bestSet && ` · mejor: ${bestSet.weight_kg}kg x ${bestSet.reps}`}
                  </p>
                </div>
                {b.estimatedOneRepMaxKg != null && (
                  <span className="whitespace-nowrap font-mono text-xs text-secondary">
                    e1RM {b.estimatedOneRepMaxKg}kg
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {nextRoutineLabel && (
        <div className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2.5">
          <CalendarClockIcon className="size-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Próxima sesión sugerida: </span>
            <span className="font-semibold">{nextRoutineLabel}</span>
          </p>
        </div>
      )}
    </section>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 p-3 text-center">
      <Icon className="size-4 text-secondary" />
      <span className="font-mono text-sm font-semibold">{value}</span>
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
    </div>
  );
}
