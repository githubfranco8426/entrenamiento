import Link from "next/link";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { shiftTypeForDate, willTrainByDefault, SHIFT_TYPE_LABELS } from "@/lib/utils/shift-pattern";
import { SHIFT_DOT_CLASSES } from "@/lib/utils/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const anchorMonth = month ? parseISO(`${month}-01`) : new Date();
  const monthStart = startOfMonth(anchorMonth);
  const monthEnd = endOfMonth(anchorMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const gridStartStr = format(gridStart, "yyyy-MM-dd");
  const gridEndStr = format(gridEnd, "yyyy-MM-dd");
  const gridEndExclusiveStr = format(addDays(gridEnd, 1), "yyyy-MM-dd");

  const supabase = await createClient();
  const [{ data: settings }, { data: workouts }, { data: microcycles }] = await Promise.all([
    supabase.from("user_settings").select("shift_anchor_date").maybeSingle(),
    supabase
      .from("workouts")
      .select("id, started_at, ended_at, routines(title, day_label)")
      .gte("started_at", gridStartStr)
      .lt("started_at", gridEndExclusiveStr),
    supabase
      .from("microcycles")
      .select("week_number, start_date, end_date, is_deload")
      .lte("start_date", gridEndStr)
      .gte("end_date", gridStartStr),
  ]);

  const anchor = settings?.shift_anchor_date ? parseISO(settings.shift_anchor_date) : null;

  function microcycleForDay(day: Date) {
    return (microcycles ?? []).find((mc) => {
      const start = parseISO(mc.start_date);
      const end = parseISO(mc.end_date);
      return day >= start && day <= end;
    });
  }

  function workoutsForDay(day: Date) {
    return (workouts ?? []).filter((w) => isSameDay(parseISO(w.started_at), day));
  }

  const prevMonthStr = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonthStr = format(addMonths(monthStart, 1), "yyyy-MM");
  const currentMonthStr = format(new Date(), "yyyy-MM");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-lg font-semibold">Calendario</h1>
          <p className="text-sm text-muted-foreground">
            Turno 4x4, semanas del programa y entrenamientos registrados.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" render={<Link href={`/calendar?month=${prevMonthStr}`} />}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="w-32 text-center text-sm font-medium capitalize sm:w-36">
            {format(monthStart, "MMMM yyyy", { locale: es })}
          </span>
          <Button variant="outline" size="icon" render={<Link href={`/calendar?month=${nextMonthStr}`} />}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {month && month !== currentMonthStr && (
        <Link href="/calendar" className="-mt-4 w-fit text-xs text-muted-foreground underline">
          Volver a hoy
        </Link>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="pb-1 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const inMonth = isSameMonth(day, monthStart);
              const shift = anchor ? shiftTypeForDate(day, anchor) : null;
              const willTrain = shift ? willTrainByDefault(shift) : true;
              const mc = microcycleForDay(day);
              const dayWorkouts = workoutsForDay(day);
              const isFirstDayOfMc = mc && isSameDay(day, parseISO(mc.start_date));

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex min-h-[4.5rem] flex-col gap-1 rounded-lg border p-1 text-xs sm:min-h-24 sm:p-1.5",
                    !inMonth && "border-transparent opacity-30",
                    inMonth && mc?.is_deload && "border-accent bg-accent/40",
                    inMonth && !mc?.is_deload && "border-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full font-medium",
                        isToday(day) && "bg-primary text-primary-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {shift && inMonth && (
                      <span
                        className={cn("size-1.5 shrink-0 rounded-full", SHIFT_DOT_CLASSES[shift])}
                        title={SHIFT_TYPE_LABELS[shift]}
                      />
                    )}
                  </div>

                  {inMonth && isFirstDayOfMc && (
                    <Badge variant={mc?.is_deload ? "secondary" : "outline"} className="w-fit text-[10px]">
                      {mc?.is_deload ? "Deload" : `Sem ${mc?.week_number}`}
                    </Badge>
                  )}

                  {inMonth && !willTrain && dayWorkouts.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/70">Descanso</span>
                  )}

                  {inMonth &&
                    dayWorkouts.map((w) => (
                      <Link
                        key={w.id}
                        href={`/workouts/${w.id}`}
                        className="truncate rounded-md bg-chart-1/15 px-1.5 py-0.5 text-[10px] font-medium text-chart-1 hover:bg-chart-1/25"
                        title={w.routines?.title ?? "Entreno libre"}
                      >
                        ✓ {w.routines?.title ?? "Entreno libre"}
                      </Link>
                    ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {(Object.keys(SHIFT_TYPE_LABELS) as Array<keyof typeof SHIFT_TYPE_LABELS>).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", SHIFT_DOT_CLASSES[key])} />
            {SHIFT_TYPE_LABELS[key]}
          </span>
        ))}
      </div>

      {!anchor && (
        <p className="text-sm text-muted-foreground">
          Configurá la fecha ancla del turno 4x4 en{" "}
          <Link href="/settings" className="underline">
            Ajustes
          </Link>{" "}
          para ver el patrón de turnos en el calendario.
        </p>
      )}
    </div>
  );
}
