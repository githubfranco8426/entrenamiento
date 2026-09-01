import Link from "next/link";
import { format, startOfISOWeek, endOfISOWeek } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { shiftTypeForDate } from "@/lib/utils/shift-pattern";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReadinessForm } from "@/components/dashboard/readiness-form";
import { BodyMetricForm } from "@/components/dashboard/body-metric-form";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { WeeklyVolume } from "@/components/dashboard/weekly-volume";

const PHASE_LABELS: Record<string, string> = {
  acumulacion: "Acumulación",
  intensificacion: "Intensificación",
  deload: "Deload",
  realizacion: "Realización",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfISOWeek(new Date()), "yyyy-MM-dd'T'00:00:00");
  const weekEnd = format(endOfISOWeek(new Date()), "yyyy-MM-dd'T'23:59:59");

  const [
    { data: settings },
    { data: readiness },
    { data: bodyMetric },
    { data: routines },
    { data: workouts },
    { data: activeMeso },
    { data: weekSets },
  ] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("readiness_logs").select("*").eq("log_date", today).maybeSingle(),
    supabase.from("body_metrics").select("*").eq("log_date", today).maybeSingle(),
    supabase.from("routines").select("id, title, day_label").order("order_index"),
    supabase
      .from("workouts")
      .select("id, routine_id, started_at, ended_at, routines(title, day_label)")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase.from("mesocycles").select("*, microcycles(*)").eq("status", "active").maybeSingle(),
    supabase
      .from("set_logs")
      .select("completed_at, workout_exercises(exercises(muscle_group))")
      .gte("completed_at", weekStart)
      .lte("completed_at", weekEnd),
  ]);

  const defaultShiftType = settings?.shift_anchor_date
    ? shiftTypeForDate(new Date(today), new Date(settings.shift_anchor_date))
    : "dia4_libre";

  const activeMicro = (activeMeso?.microcycles ?? []).find((m) => m.status === "active");

  const lastTrainedByRoutine = new Map<string, string>();
  for (const w of workouts ?? []) {
    if (w.routine_id && !lastTrainedByRoutine.has(w.routine_id)) {
      lastTrainedByRoutine.set(w.routine_id, w.started_at);
    }
  }
  const nextRoutine = [...(routines ?? [])].sort((a, b) => {
    const da = lastTrainedByRoutine.get(a.id);
    const db = lastTrainedByRoutine.get(b.id);
    if (!da && !db) return 0;
    if (!da) return -1;
    if (!db) return 1;
    return da.localeCompare(db);
  })[0];

  const volumeMap = new Map<string, number>();
  for (const s of weekSets ?? []) {
    const group = s.workout_exercises?.exercises?.muscle_group ?? "Sin clasificar";
    volumeMap.set(group, (volumeMap.get(group) ?? 0) + 1);
  }
  const volumeByMuscle = [...volumeMap.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Mission Control
          </p>
          <h1 className="font-heading text-xl font-bold">{format(new Date(), "EEEE d MMMM")}</h1>
        </div>
        {activeMeso && (
          <Badge variant="outline" className="border-secondary/40 text-secondary">
            {activeMeso.name}
            {activeMicro && ` · Semana ${activeMicro.week_number}`}
          </Badge>
        )}
      </div>

      {activeMeso ? (
        <Card>
          <CardHeader>
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-secondary">
              Fase actual
            </CardDescription>
            <CardTitle className="text-base">
              {PHASE_LABELS[activeMeso.phase] ?? activeMeso.phase}
              {activeMicro?.is_deload && " · Descarga"}
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay un mesociclo activo. Activá uno en{" "}
          <Link href="/program" className="text-primary underline underline-offset-2">
            Programa
          </Link>
          .
        </p>
      )}

      {nextRoutine && (
        <Card className="ring-primary/30">
          <CardHeader>
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Próximo
            </CardDescription>
            <CardTitle className="text-lg">{nextRoutine.title}</CardTitle>
            {nextRoutine.day_label && <CardDescription>{nextRoutine.day_label}</CardDescription>}
          </CardHeader>
          <CardContent>
            <StartWorkoutButton routineId={nextRoutine.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Volumen semanal (sets por grupo muscular)
          </CardTitle>
          <CardDescription>Semana en curso, sets completados.</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyVolume volumeByMuscle={volumeByMuscle} />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Readiness de hoy</CardTitle>
            <CardDescription>{today}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessForm today={today} defaultShiftType={defaultShiftType} initial={readiness ?? null} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Peso corporal</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMetricForm today={today} initial={bodyMetric ?? null} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rutinas</CardTitle>
              <CardDescription>Iniciá un entrenamiento desde una rutina, o uno libre.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {(routines ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay rutinas. Creá una en{" "}
                  <Link href="/routines" className="underline">
                    Rutinas
                  </Link>
                  .
                </p>
              )}
              {(routines ?? []).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    {r.day_label && <p className="text-xs text-muted-foreground">{r.day_label}</p>}
                  </div>
                  <StartWorkoutButton routineId={r.id} />
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <StartWorkoutButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos entrenamientos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(workouts ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no registraste ningún entrenamiento.</p>
          )}
          {(workouts ?? []).map((w) => (
            <Link
              key={w.id}
              href={`/workouts/${w.id}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              <span>{w.routines?.title ?? "Entreno libre"}</span>
              <span className="font-mono text-muted-foreground">
                {format(new Date(w.started_at), "dd/MM/yyyy HH:mm")}
                {!w.ended_at && " · en curso"}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
