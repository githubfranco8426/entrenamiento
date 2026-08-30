import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { shiftTypeForDate } from "@/lib/utils/shift-pattern";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ReadinessForm } from "@/components/dashboard/readiness-form";
import { BodyMetricForm } from "@/components/dashboard/body-metric-form";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: settings }, { data: readiness }, { data: bodyMetric }, { data: routines }, { data: workouts }] =
    await Promise.all([
      supabase.from("user_settings").select("*").maybeSingle(),
      supabase.from("readiness_logs").select("*").eq("log_date", today).maybeSingle(),
      supabase.from("body_metrics").select("*").eq("log_date", today).maybeSingle(),
      supabase.from("routines").select("id, title, day_label").order("order_index"),
      supabase
        .from("workouts")
        .select("id, started_at, ended_at, routines(title, day_label)")
        .order("started_at", { ascending: false })
        .limit(5),
    ]);

  const defaultShiftType = settings?.shift_anchor_date
    ? shiftTypeForDate(new Date(today), new Date(settings.shift_anchor_date))
    : "dia4_libre";

  return (
    <div className="flex flex-col gap-6">
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
              <span className="text-muted-foreground">
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
