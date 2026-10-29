import type { AcwrZone } from "@/lib/analytics/acwr";

export function DaySummaryRings({ energyLevel, trainedDays, totalDays, acwrRatio }: {
  energyLevel: number | null;
  trainedDays: number;
  totalDays: number;
  acwrRatio: number | null;
  acwrZone: AcwrZone | null;
}) {
  const metrics = [
    { label: "Energía", value: energyLevel ?? "—", unit: "/ 5", detail: "Último check-in de hoy" },
    { label: "Sesiones", value: trainedDays, unit: "", detail: `Días entrenados de ${totalDays}` },
    { label: "Carga ACWR", value: acwrRatio?.toFixed(2) ?? "—", unit: "", detail: "Relación de carga 7 / 28 días" },
  ];
  return (
    <section aria-label="Resumen de actividad" className="rounded-lg border border-border bg-card p-4 shadow-(--shadow-panel)">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estado de hoy</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {metrics.map((m) => <div key={m.label} className="min-w-0 rounded-md bg-muted p-2.5 sm:p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-secondary">{m.label}</p>
          <p className="my-2 flex flex-wrap items-baseline gap-1 text-2xl font-semibold tracking-tight text-foreground">{m.value}<span className="text-xs font-normal text-muted-foreground">{m.unit}</span></p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">{m.detail}</p>
        </div>)}
      </div>
    </section>
  );
}
