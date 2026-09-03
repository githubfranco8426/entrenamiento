import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckIcon, DumbbellIcon, FlameIcon } from "lucide-react";

const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function WeeklyActivity({ weekDays, trainedDates }: { weekDays: Date[]; trainedDates: Date[] }) {
  const today = new Date();
  const trainedCount = weekDays.filter((d) => trainedDates.some((t) => isSameDay(t, d))).length;

  return (
    <section className="flex flex-col gap-gutter-md rounded-xl bg-card p-container-padding ring-1 ring-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-headline-md font-bold">Tu semana activa</h3>
          <p className="text-xs text-muted-foreground">Constancia sin presiones ni culpas</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <FlameIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{trainedCount} de {weekDays.length} días</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 py-1">
        {weekDays.map((day, i) => {
          const trained = trainedDates.some((t) => isSameDay(t, day));
          const isToday = isSameDay(day, today);
          const isFuture = day > today && !isToday;
          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1.5">
              <span className={cn("text-[11px] text-muted-foreground", isToday && "font-bold text-primary")}>
                {DAY_LETTERS[i]}
              </span>
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  trained && "bg-primary text-primary-foreground shadow-sm",
                  !trained && isToday && "animate-pulse bg-primary/20 text-primary",
                  !trained && !isToday && !isFuture && "bg-muted text-muted-foreground",
                  !trained && isFuture && "bg-background text-muted-foreground/40",
                )}
              >
                {trained ? (
                  <CheckIcon className="size-[18px]" />
                ) : isToday ? (
                  <DumbbellIcon className="size-[18px]" />
                ) : (
                  <span className="text-xs">{format(day, "d")}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
