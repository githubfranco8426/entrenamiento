type ReadinessLog = {
  log_date: string;
  sleep_hours: number | null;
  energy_level: number | null;
  muscle_soreness: number | null;
};

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function ReadinessTrendCard({ logs }: { logs: ReadinessLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no registraste check-ins de readiness. Completá &quot;¿Cómo te sentís hoy?&quot; en el panel
        para ver tu tendencia acá.
      </p>
    );
  }

  const avgSleep = average(logs.map((l) => l.sleep_hours));
  const avgEnergy = average(logs.map((l) => l.energy_level));
  const avgSoreness = average(logs.map((l) => l.muscle_soreness));

  const sleepBars = [...logs].reverse();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sueño prom." value={avgSleep != null ? `${avgSleep}h` : "—"} accent="text-primary" />
        <Stat label="Energía prom." value={avgEnergy != null ? `${avgEnergy}/5` : "—"} accent="text-secondary" />
        <Stat label="Dolor musc." value={avgSoreness != null ? `${avgSoreness}/5` : "—"} accent="text-tertiary" />
      </div>

      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Sueño por día
        </p>
        <div className="flex h-16 items-end gap-1.5">
          {sleepBars.map((log) => {
            const hours = log.sleep_hours ?? 0;
            const heightPct = Math.min(100, (hours / 9) * 100);
            return (
              <div key={log.log_date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-12 w-full items-end overflow-hidden rounded-sm bg-muted">
                  <div
                    className="w-full rounded-sm bg-primary"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {new Date(log.log_date).toLocaleDateString("es", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 p-3 text-center">
      <span className={`font-mono text-lg font-bold ${accent}`}>{value}</span>
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
    </div>
  );
}
