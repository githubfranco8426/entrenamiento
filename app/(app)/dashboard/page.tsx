import Link from "next/link";
import {
  format,
  addDays,
  parseISO,
  startOfISOWeek,
  endOfISOWeek,
  eachDayOfInterval,
  differenceInCalendarDays,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { SettingsIcon, SparklesIcon, ClockIcon, CheckCircleIcon, UtensilsIcon, ChevronRightIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRoutineScope } from "@/lib/training/routine-scope";
import { shiftTypeForDate, SHIFT_TYPE_LABELS } from "@/lib/utils/shift-pattern";
import { MEAL_PLAN_BY_SHIFT } from "@/lib/nutrition/plan";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ReadinessQuickCheckin } from "@/components/dashboard/readiness-quick-checkin";
import { BodyMetricForm } from "@/components/dashboard/body-metric-form";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { TodaysRoutineHero } from "@/components/dashboard/todays-routine-hero";
import { WeeklyActivity } from "@/components/dashboard/weekly-activity";
import { WeeklyVolume } from "@/components/dashboard/weekly-volume";
import { StagnationAlert, type StagnantExercise } from "@/components/dashboard/stagnation-alert";
import { DeleteButton } from "@/components/ui/delete-button";
import { RunReviewCard } from "@/components/ai/run-review-card";
import { PeriodizationDecisionSchema } from "@/lib/ai/schema";
import { AcwrAlert } from "@/components/dashboard/acwr-alert";
import { DaySummaryRings } from "@/components/dashboard/day-summary-rings";
import { computeAcwr, type DailyLoad } from "@/lib/analytics/acwr";
import { localCalendarDate, localDateKey, localDayStart, localHour } from "@/lib/utils/local-date";
import { pickNextRoutine } from "@/lib/utils/next-routine";

const PHASE_LABELS: Record<string, string> = {
  acumulacion: "Acumulación",
  intensificacion: "Intensificación",
  deload: "Deload",
  realizacion: "Realización",
};

function workoutDurationLabel(startedAt: string, endedAt: string | null): string | null {
  if (!endedAt) return null;
  const minutes = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const routineScope = await getRoutineScope(supabase);
  const now = new Date();
  const calendarToday = localCalendarDate(now);
  const today = localDateKey(now);
  const weekStart = localDayStart(format(startOfISOWeek(calendarToday), "yyyy-MM-dd"));
  const weekEnd = localDayStart(format(addDays(endOfISOWeek(calendarToday), 1), "yyyy-MM-dd"));

  const [
    { data: settings },
    { data: readiness },
    { data: bodyMetric },
    { data: routines },
    { data: workouts },
    { data: activeMeso },
    { data: weekSets },
    { data: pendingRuns },
  ] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("readiness_logs").select("*").eq("log_date", today).maybeSingle(),
    supabase.from("body_metrics").select("*").eq("log_date", today).maybeSingle(),
    supabase
      .from("routines")
      .select(
        "id, title, day_label, routine_exercises(exercise_id, order_index, notes, exercises(name, thumbnail_url), target_sets(set_index, target_reps_min, target_reps_max, target_rpe, target_weight_kg))",
      )
      .or(routineScope)
      .order("order_index"),
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
      .lt("completed_at", weekEnd),
    supabase
      .from("ai_periodization_runs")
      .select("id, triggered_at, raw_output")
      .eq("status", "pending_review")
      .order("triggered_at", { ascending: false })
      .limit(1),
  ]);

  const pendingRun = pendingRuns?.[0];
  const pendingDecision = pendingRun
    ? PeriodizationDecisionSchema.safeParse(pendingRun.raw_output)
    : null;

  const twentyEightDaysAgo = addDays(calendarToday, -27);
  const { data: acwrSets } = await supabase
    .from("set_logs")
    .select("weight_kg, reps, completed_at")
    .not("weight_kg", "is", null)
    .not("reps", "is", null)
    .gte("completed_at", localDayStart(format(twentyEightDaysAgo, "yyyy-MM-dd")))
    .limit(2000);

  const loadByDay = new Map<string, number>();
  for (const s of acwrSets ?? []) {
    const day = localDateKey(s.completed_at);
    const load = (s.weight_kg ?? 0) * (s.reps ?? 0);
    loadByDay.set(day, (loadByDay.get(day) ?? 0) + load);
  }
  const dailyLoads: DailyLoad[] = Array.from({ length: 28 }, (_, i) => {
    const date = format(addDays(calendarToday, -(27 - i)), "yyyy-MM-dd");
    return { date, load: loadByDay.get(date) ?? 0 };
  });
  const acwr = computeAcwr(dailyLoads);
  const acwrAlertZone = acwr.zone === "riesgo" || acwr.zone === "precaucion" ? acwr.zone : null;

  const { data: weekWorkouts } = await supabase
    .from("workouts")
    .select("started_at")
    .gte("started_at", weekStart)
    .lt("started_at", weekEnd);

  const weekDays = eachDayOfInterval({ start: startOfISOWeek(calendarToday), end: endOfISOWeek(calendarToday) });
  const trainedDates = (weekWorkouts ?? []).map((w) => localCalendarDate(w.started_at));
  const trainedCount = weekDays.filter((d) => trainedDates.some((t) => isSameDay(t, d))).length;

  const defaultShiftType = readiness?.shift_type ?? (settings?.shift_anchor_date
    ? shiftTypeForDate(calendarToday, parseISO(settings.shift_anchor_date))
    : "dia4_libre");

  const activeMicro = (activeMeso?.microcycles ?? []).find((m) => m.status === "active");

  const homeToday = /en casa/i.test(readiness?.notes ?? "");
  const homeRoutines = (routines ?? []).filter((r) => /casa|home/i.test(`${r.title} ${r.day_label ?? ""}`));
  const nextRoutine = pickNextRoutine(homeToday && homeRoutines.length ? homeRoutines : routines ?? [], workouts ?? []);
  const todaysWorkout = (workouts ?? []).find((w) => isSameDay(localCalendarDate(w.started_at), calendarToday));

  const daysSinceLastTrained = nextRoutine
    ? (() => {
        const last = (workouts ?? []).find((w) => w.routine_id === nextRoutine.id)?.started_at;
        return last ? differenceInCalendarDays(calendarToday, localCalendarDate(last)) : null;
      })()
    : null;

  const nextExerciseIds = [
    ...new Set((nextRoutine?.routine_exercises ?? []).map((re) => re.exercise_id)),
  ];

  const stagnantExercises: StagnantExercise[] = [];
  if (nextExerciseIds.length > 0) {
    const { data: history } = await supabase
      .from("workout_exercises")
      .select("exercise_id, workout_id, set_logs(weight_kg), workouts!inner(started_at, ended_at)")
      .in("exercise_id", nextExerciseIds)
      .not("workouts.ended_at", "is", null)
      .order("started_at", { referencedTable: "workouts", ascending: false })
      .limit(60);

    type Session = { startedAt: string; maxWeight: number };
    const sessionsByExercise = new Map<string, Session[]>();
    for (const row of history ?? []) {
      const weights = (row.set_logs ?? [])
        .map((s) => s.weight_kg)
        .filter((w): w is number => w != null);
      if (weights.length === 0 || !row.workouts) continue;
      const maxWeight = Math.max(...weights);
      const list = sessionsByExercise.get(row.exercise_id) ?? [];
      list.push({ startedAt: row.workouts.started_at, maxWeight });
      sessionsByExercise.set(row.exercise_id, list);
    }

    for (const re of nextRoutine?.routine_exercises ?? []) {
      const sessions = (sessionsByExercise.get(re.exercise_id) ?? []).sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt),
      );
      if (sessions.length < 2) continue;

      let streak = 1;
      for (let i = 0; i < sessions.length - 1; i++) {
        if (sessions[i].maxWeight <= sessions[i + 1].maxWeight) streak++;
        else break;
      }
      if (streak < 2) continue;

      const targetSets = [...(re.target_sets ?? [])].sort((a, b) => a.set_index - b.set_index);
      stagnantExercises.push({
        exerciseName: re.exercises?.name ?? "Ejercicio",
        sessionsStagnant: streak,
        lastWeightKg: sessions[0].maxWeight,
        targetWeightKg: targetSets[0]?.target_weight_kg ?? null,
      });
    }
  }

  const volumeMap = new Map<string, number>();
  for (const s of weekSets ?? []) {
    const group = s.workout_exercises?.exercises?.muscle_group ?? "Sin clasificar";
    volumeMap.set(group, (volumeMap.get(group) ?? 0) + 1);
  }
  const volumeByMuscle = [...volumeMap.entries()].sort((a, b) => b[1] - a[1]);

  const hour = localHour(now);
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-col gap-gutter-lg">
      <section className="relative border-b border-white/10 pb-5 pt-1 sm:pb-6">
        <div className="flex flex-col gap-gutter-sm">
        <div className="flex items-center justify-between">
          {activeMeso ? (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">
              <SparklesIcon className="size-4" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                Adaptación inteligente activa
              </span>
            </div>
          ) : (
            <span />
          )}
          <Link
            href="/settings"
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <SettingsIcon className="size-4" />
            <span className="sr-only">Ajustes</span>
          </Link>
        </div>
        <div className="flex flex-col">
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90">Estado del sistema · En vivo</p>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{greeting} <span className="text-secondary">·</span> listo para entrenar</h1>
          <p className="mt-1 text-sm text-slate-300">
            {format(calendarToday, "EEEE d 'de' MMMM", { locale: es })}
            {activeMeso &&
              ` · ${PHASE_LABELS[activeMeso.phase] ?? activeMeso.phase}${activeMicro?.is_deload ? " (Descarga)" : ""}${activeMicro ? ` · Semana ${activeMicro.week_number}` : ""}`}
          </p>
        </div>
        </div>
      </section>

      <div className="order-2 flex min-w-0 flex-col gap-3">
        {readiness && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
            <p className="font-medium text-primary">{SHIFT_TYPE_LABELS[readiness.shift_type]}</p>
            <p className="mt-1 text-muted-foreground">{readiness.will_train ? "Entrenamiento previsto" : "Día de recuperación"}{homeToday ? " · En casa" : ""}</p>
            {readiness.notes && <p className="mt-1 break-words text-xs text-muted-foreground">{readiness.notes}</p>}
          </div>
        )}
        <DaySummaryRings
          energyLevel={readiness?.energy_level ?? null}
          trainedDays={trainedCount}
          totalDays={weekDays.length}
          acwrRatio={acwr.ratio}
          acwrZone={acwr.zone}
        />
      </div>

      <Link
        href="/nutricion"
        className="order-7 group flex items-center gap-3 rounded-2xl border border-border/80 bg-card/75 p-container-padding shadow-[0_14px_30px_-24px_rgba(0,0,0,.9)] transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent/70"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20"><UtensilsIcon className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Nutrición</p>
          <p className="truncate text-xs text-muted-foreground">
            {MEAL_PLAN_BY_SHIFT[defaultShiftType].totalKcal} kcal de plan hoy
          </p>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>

      {acwrAlertZone && acwr.ratio != null && (
        <div className="order-6"><AcwrAlert ratio={acwr.ratio} zone={acwrAlertZone} /></div>
      )}

      {pendingDecision?.success && pendingRun && (
        <div className="order-8 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-primary">
              Nueva propuesta de progresión — revisala
            </h2>
          </div>
          <RunReviewCard
            runId={pendingRun.id}
            triggeredAt={pendingRun.triggered_at}
            decision={pendingDecision.data}
          />
        </div>
      )}

      <div className="order-5"><StagnationAlert exercises={stagnantExercises} /></div>

      <div className="order-4">
        <ReadinessQuickCheckin
          today={today}
          defaultShiftType={defaultShiftType}
          initial={readiness ?? null}
          aiNote={
            !todaysWorkout && nextRoutine
              ? readiness
                ? `Tu check-in permite mantener "${nextRoutine.title}" tal como está planificada.`
                : `Completá el check-in para confirmar si "${nextRoutine.title}" es adecuada para hoy.`
              : null
          }
        />
      </div>

      <div className="order-1">
      {todaysWorkout?.ended_at ? (
        <div className="flex items-center gap-3 rounded-xl bg-card p-container-padding ring-1 ring-border shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_20px_-8px_rgba(0,0,0,0.6)]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CheckCircleIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-headline-sm font-bold">Ya entrenaste hoy</p>
            <p className="truncate text-sm text-muted-foreground">
              {todaysWorkout.routines?.title ?? "Entreno libre"} · buen trabajo, descansá lo que necesites.
            </p>
          </div>
          <Link
            href={`/workouts/${todaysWorkout.id}`}
            className="shrink-0 text-sm text-primary underline underline-offset-2"
          >
            Ver
          </Link>
        </div>
      ) : todaysWorkout ? (
        <Link
          href={`/workouts/${todaysWorkout.id}`}
          className="flex items-center gap-3 rounded-xl bg-card p-container-padding ring-1 ring-border shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_20px_-8px_rgba(0,0,0,0.6)] transition-colors hover:bg-accent"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ClockIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-headline-sm font-bold">Entrenamiento en curso</p>
            <p className="truncate text-sm text-muted-foreground">
              {todaysWorkout.routines?.title ?? "Entreno libre"} · continuá donde quedaste.
            </p>
          </div>
        </Link>
      ) : nextRoutine ? (
        <TodaysRoutineHero
          routine={nextRoutine}
          daysSinceLastTrained={daysSinceLastTrained}
          hasActiveMeso={!!activeMeso}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay rutinas. Creá una en{" "}
          <Link href="/routines" className="text-primary underline underline-offset-2">
            Rutinas
          </Link>
          .
        </p>
      )}
      </div>

      <div className="order-3"><WeeklyActivity weekDays={weekDays} trainedDates={trainedDates} today={calendarToday} /></div>

      {!activeMeso && (
        <p className="order-9 text-sm text-muted-foreground">
          No hay un mesociclo activo. Activá uno en{" "}
          <Link href="/program" className="text-primary underline underline-offset-2">
            Programa
          </Link>
          .
        </p>
      )}

      <div className="order-10 flex flex-col gap-3">
        <h2 className="border-b border-border pb-2 font-heading text-base font-bold uppercase tracking-wide text-primary">
          Volumen semanal
        </h2>
        <WeeklyVolume volumeByMuscle={volumeByMuscle} />
      </div>

      <div className="order-11 grid gap-6 sm:grid-cols-2">
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
            <CardTitle>Todas las rutinas</CardTitle>
            <CardDescription>Iniciá un entrenamiento desde cualquier rutina, o uno libre.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StartWorkoutButton
              className="w-full justify-start gap-2 bg-muted text-foreground hover:bg-accent"
              label="Empezar entreno libre"
            />

            {(routines ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay rutinas. Creá una en{" "}
                <Link href="/routines" className="underline">
                  Rutinas
                </Link>
                .
              </p>
            )}
            {(routines ?? []).map((r) => {
              const exerciseNames = (r.routine_exercises ?? [])
                .map((re) => re.exercises?.name)
                .filter((name): name is string => !!name);
              return (
                <div key={r.id} className="flex flex-col gap-2.5 rounded-lg bg-muted/60 p-3">
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    {r.day_label && (
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.day_label}
                      </p>
                    )}
                    {exerciseNames.length > 0 && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{exerciseNames.join(", ")}</p>
                    )}
                  </div>
                  <StartWorkoutButton routineId={r.id} className="w-full" label="Iniciar rutina" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="order-12">
        <CardHeader>
          <CardTitle>Últimos entrenamientos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(workouts ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no registraste ningún entrenamiento.</p>
          )}
          {(workouts ?? []).map((w) => {
            const duration = workoutDurationLabel(w.started_at, w.ended_at);
            return (
              <div key={w.id} className="flex items-center gap-2">
                <Link
                  href={`/workouts/${w.id}`}
                  className="flex flex-1 items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-secondary">
                    <ClockIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{w.routines?.title ?? "Entreno libre"}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" }).format(new Date(w.started_at))}
                    </p>
                  </div>
                  {!w.ended_at ? (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-primary">
                      En curso
                    </span>
                  ) : (
                    duration && (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{duration}</span>
                    )
                  )}
                </Link>
                <DeleteButton
                  endpoint={`/api/workouts/${w.id}`}
                  confirmMessage={`¿Borrar el entrenamiento "${w.routines?.title ?? "Entreno libre"}" del ${format(localCalendarDate(w.started_at), "dd/MM/yyyy")}? Esta acción no se puede deshacer.`}
                  successMessage="Entrenamiento borrado"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
