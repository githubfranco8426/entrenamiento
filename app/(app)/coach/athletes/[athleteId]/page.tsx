import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeftIcon, DumbbellIcon, MoonIcon, ScaleIcon, LayersIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AthleteSummary {
  recentWorkouts: Array<{
    id: string;
    started_at: string;
    ended_at: string | null;
    routine_title: string | null;
    day_label: string | null;
  }>;
  latestReadiness: {
    log_date: string;
    energy_level: number | null;
    sleep_hours: number | null;
    muscle_soreness: number | null;
  } | null;
  latestBodyMetric: { log_date: string; weight_kg: number | null } | null;
  routineCount: number;
  weekSetCount: number;
}

export default async function AthleteSummaryPage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params;
  const supabase = await createClient();

  const [{ data: link }, { data: summaryRaw, error }] = await Promise.all([
    supabase
      .from("coach_athlete_links")
      .select("athlete_email")
      .eq("athlete_id", athleteId)
      .eq("status", "active")
      .maybeSingle(),
    supabase.rpc("get_athlete_summary", { target_athlete_id: athleteId }),
  ]);

  if (error || !link) notFound();
  const summary = summaryRaw as unknown as AthleteSummary;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/coach" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Coach
      </Link>

      <h1 className="font-heading text-xl font-bold">{link.athlete_email ?? "Atleta"}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={LayersIcon} label="Sets esta semana" value={String(summary.weekSetCount)} />
        <Stat icon={DumbbellIcon} label="Rutinas" value={String(summary.routineCount)} />
        <Stat
          icon={MoonIcon}
          label="Energía"
          value={summary.latestReadiness?.energy_level != null ? `${summary.latestReadiness.energy_level}/5` : "—"}
        />
        <Stat
          icon={ScaleIcon}
          label="Peso"
          value={summary.latestBodyMetric?.weight_kg != null ? `${summary.latestBodyMetric.weight_kg}kg` : "—"}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/coach/athletes/${athleteId}/routines`}
          className="flex-1 rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
        >
          Prescribir rutinas
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos entrenamientos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {summary.recentWorkouts.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no registró ningún entrenamiento.</p>
          )}
          {summary.recentWorkouts.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span>{w.routine_title ?? "Entreno libre"}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {format(new Date(w.started_at), "dd/MM/yyyy HH:mm", { locale: es })}
                {!w.ended_at && " · en curso"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-card p-3 text-center ring-1 ring-border">
      <Icon className="size-4 text-secondary" />
      <span className="font-mono text-sm font-semibold">{value}</span>
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
    </div>
  );
}
