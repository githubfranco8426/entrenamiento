"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { ACWR_ZONE_LABELS, type AcwrZone } from "@/lib/analytics/acwr";
import { cn } from "@/lib/utils";

const ZONE_STYLES: Record<AcwrZone, string> = {
  undertraining: "bg-secondary/15 text-secondary",
  optimo: "bg-primary/15 text-primary",
  precaucion: "bg-tertiary/15 text-tertiary",
  riesgo: "bg-destructive/15 text-destructive",
};

export function AcwrCard({
  acuteLoad,
  chronicLoad,
  ratio,
  zone,
  dailyLoads,
}: {
  acuteLoad: number;
  chronicLoad: number;
  ratio: number | null;
  zone: AcwrZone | null;
  dailyLoads: { date: string; load: number }[];
}) {
  const chartData = dailyLoads.map((d) => ({ ...d, label: format(new Date(d.date), "dd/MM") }));

  return (
    <div className="flex flex-col gap-4">
      {ratio == null ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay suficiente historial (necesitás al menos algunos días de carga en las últimas 4
          semanas) para calcular el ACWR.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Carga aguda (7d)" value={Math.round(acuteLoad).toLocaleString("es")} />
          <Stat label="Carga crónica" value={Math.round(chronicLoad).toLocaleString("es")} />
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 p-3 text-center">
            <span className="font-mono text-lg font-bold">{ratio.toFixed(2)}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
                zone && ZONE_STYLES[zone],
              )}
            >
              {zone && ACWR_ZONE_LABELS[zone]}
            </span>
          </div>
        </div>
      )}

      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={3} />
            <ReferenceLine x={chartData[chartData.length - 7]?.label} stroke="var(--border)" strokeDasharray="3 3" />
            <Bar dataKey="load" radius={[2, 2, 0, 0]} fill="var(--chart-1)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Volumen diario (kg) últimos 28 días · línea punteada marca el corte de los últimos 7 días
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 p-3 text-center">
      <span className="font-mono text-lg font-bold">{value}</span>
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
    </div>
  );
}
