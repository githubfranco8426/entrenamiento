const BAR_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

export function WeeklyVolume({ volumeByMuscle }: { volumeByMuscle: [string, number][] }) {
  if (volumeByMuscle.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no registraste sets esta semana.</p>;
  }

  const max = Math.max(...volumeByMuscle.map(([, count]) => count));

  return (
    <div className="flex flex-col gap-3">
      {volumeByMuscle.map(([group, count], i) => (
        <div key={group} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-wide text-foreground">{group}</span>
            <span className="font-mono text-muted-foreground">{count} sets</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
              style={{ width: `${Math.max(6, (count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
