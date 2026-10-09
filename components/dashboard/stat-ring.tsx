import { cn } from "@/lib/utils";

/**
 * Anillo circular de telemetría (Kinetic Obsidian): traza fina, sin glow, valor
 * monoespaciado al centro. Usado para condensar en un vistazo lo que antes eran
 * barras/cajas más anchas (readiness, semana activa, carga ACWR, etc.).
 */
export function StatRing({
  pct,
  label,
  value,
  color = "var(--primary)",
  size = 84,
  strokeWidth = 6,
}: {
  /** 0-100 */
  pct: number;
  label: string;
  value: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex min-w-0 w-full flex-col items-center gap-1.5">
      <div className="relative aspect-square w-full" style={{ maxWidth: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-sm font-bold text-foreground">{value}</span>
        </div>
      </div>
      <span
        className={cn(
          "max-w-full break-words text-center font-mono text-[9px] uppercase tracking-wide sm:text-[10px] sm:tracking-widest text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
