import { StatRing } from "@/components/dashboard/stat-ring";
import type { AcwrZone } from "@/lib/analytics/acwr";

const ACWR_RING_COLOR: Record<AcwrZone, string> = {
  undertraining: "var(--secondary)",
  optimo: "var(--primary)",
  precaucion: "var(--tertiary)",
  riesgo: "var(--destructive)",
};

/**
 * Resumen del día en 3 anillos (readiness, constancia semanal, carga) — reemplaza
 * la fila de cajas/barras dispersas que hacían la pantalla inicial demasiado larga.
 * Da el mismo vistazo de estado en menos espacio vertical.
 */
export function DaySummaryRings({
  energyLevel,
  trainedDays,
  totalDays,
  acwrRatio,
  acwrZone,
}: {
  energyLevel: number | null;
  trainedDays: number;
  totalDays: number;
  acwrRatio: number | null;
  acwrZone: AcwrZone | null;
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-card/70 p-2 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between px-2 pt-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado de hoy</p>
        <span className="text-[11px] text-primary">Lectura rápida</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center justify-center rounded-xl bg-background/45 py-3 transition-transform hover:-translate-y-0.5">
        <StatRing
          pct={energyLevel != null ? (energyLevel / 5) * 100 : 0}
          value={energyLevel != null ? `${energyLevel}/5` : "—"}
          label="Readiness"
          color="var(--primary)"
        />
        <span className="mt-1 text-[10px] text-muted-foreground">Energía y recuperación</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-background/45 py-3 transition-transform hover:-translate-y-0.5">
        <StatRing
          pct={totalDays > 0 ? (trainedDays / totalDays) * 100 : 0}
          value={`${trainedDays}/${totalDays}`}
          label="Semana activa"
          color="var(--secondary)"
        />
        <span className="mt-1 text-[10px] text-muted-foreground">Días completados</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-background/45 py-3 transition-transform hover:-translate-y-0.5">
        <StatRing
          pct={acwrRatio != null ? Math.min(100, (acwrRatio / 2) * 100) : 0}
          value={acwrRatio != null ? acwrRatio.toFixed(2) : "—"}
          label="Carga (ACWR)"
          color={acwrZone ? ACWR_RING_COLOR[acwrZone] : "var(--muted-foreground)"}
        />
        <span className="mt-1 text-[10px] text-muted-foreground">Carga de 28 días</span>
      </div>
      </div>
    </section>
  );
}
