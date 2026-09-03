import { differenceInMinutes } from "date-fns";
import { ClockIcon, LayersIcon, TrendingUpIcon, GaugeIcon } from "lucide-react";
import { repsInReserve } from "@/lib/autoregulation/rpe-tables";

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

/** Informe post-sesión: derivado enteramente de datos ya registrados, sin métricas inventadas. */
export function WorkoutSummary({
  startedAt,
  endedAt,
  blocks,
}: {
  startedAt: string;
  endedAt: string;
  blocks: SummaryBlock[];
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
    <section className="flex flex-col gap-gutter-md rounded-xl bg-card p-container-padding ring-1 ring-border">
      <h2 className="font-heading text-headline-md font-bold">Informe post-sesión</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryStat icon={ClockIcon} label="Duración" value={`${durationMin} min`} />
        <SummaryStat icon={LayersIcon} label="Series" value={String(totalSets)} />
        <SummaryStat icon={TrendingUpIcon} label="Volumen" value={`${Math.round(totalVolumeKg).toLocaleString("es")} kg`} />
        <SummaryStat icon={GaugeIcon} label="RIR promedio" value={avgRir != null ? String(avgRir) : "—"} />
      </div>

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
