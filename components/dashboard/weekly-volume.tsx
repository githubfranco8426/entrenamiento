import { cn } from "@/lib/utils";
import { volumeLandmarkFor } from "@/lib/training/volume-landmarks";

export function WeeklyVolume({ volumeByMuscle }: { volumeByMuscle: [string, number][] }) {
  if (volumeByMuscle.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no registraste sets esta semana.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {volumeByMuscle.map(([group, count]) => (
        <VolumeCard key={group} group={group} count={count} />
      ))}
    </div>
  );
}

function VolumeCard({ group, count }: { group: string; count: number }) {
  const landmark = volumeLandmarkFor(group);

  if (!landmark) {
    return (
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex items-end justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{group}</span>
          <span className="font-mono text-lg text-foreground">{count} sets</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted" />
      </div>
    );
  }

  const { mev, mav } = landmark;
  const isOver = count > mav;
  const isUnder = count < mev;
  const status = isOver ? "OVER MAV" : isUnder ? "UNDER MEV" : count === mav ? "MAX ADAPTIVE" : "OPTIMAL";
  const statusColor = isOver ? "text-destructive" : isUnder ? "text-secondary" : "text-primary";

  const scale = Math.max(count, mav);
  const mevPct = Math.min(100, (Math.min(count, mev) / scale) * 100);
  const midPct = Math.min(100, (Math.min(count, mav) / scale) * 100) - mevPct;
  const overPct = Math.max(0, ((count - mav) / scale) * 100);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-end justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{group}</span>
        <span className="font-mono text-lg text-foreground">
          {count} <span className="text-xs text-muted-foreground">/ {mav} MAV</span>
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", isUnder ? "bg-secondary" : "bg-primary")} style={{ width: `${mevPct}%` }} />
        {midPct > 0 && <div className="h-full bg-primary/50" style={{ width: `${midPct}%` }} />}
        {overPct > 0 && <div className="h-full bg-destructive" style={{ width: `${overPct}%` }} />}
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[10px]">
        <span className="text-muted-foreground">MEV: {mev}</span>
        <span className={statusColor}>{status}</span>
      </div>
    </div>
  );
}
