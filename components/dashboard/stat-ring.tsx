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
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
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
          "text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
