import { format } from "date-fns";

export interface LoadMatrixSession {
  date: string;
  weightKg: number;
  reps: number | null;
  rir: number | null;
  estimatedOneRepMaxKg: number | null;
}

export function LoadMatrix({ sessions }: { sessions: LoadMatrixSession[] }) {
  if (sessions.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-4 gap-2 border-b border-border bg-muted/40 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>Sesión</span>
        <span className="text-right">Carga</span>
        <span className="text-right">Reps · RIR</span>
        <span className="text-right">e1RM</span>
      </div>
      {sessions.map((s, i) => (
        <div
          key={`${s.date}-${i}`}
          className="grid grid-cols-4 gap-2 border-b border-border/60 px-3 py-1.5 font-mono text-sm last:border-b-0"
        >
          <span className="text-muted-foreground">{format(new Date(s.date), "dd MMM")}</span>
          <span className="text-right text-foreground">{s.weightKg}kg</span>
          <span className="text-right text-secondary">
            {s.reps ?? "—"}
            {s.rir != null && ` · RIR${s.rir}`}
          </span>
          <span className="text-right text-primary">{s.estimatedOneRepMaxKg ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}
