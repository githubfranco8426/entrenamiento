import { parseISO } from "date-fns";

export const APP_TIME_ZONE = "America/Santiago";

/** Calendar date in Chile, independent of the server or device time zone. */
export function localDateKey(instant: Date | string = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(instant));
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Date-fns calendar arithmetic uses this wall-clock date, not a UTC instant. */
export function localCalendarDate(instant: Date | string = new Date()): Date {
  return parseISO(localDateKey(instant));
}

/** Midnight in Chile as a UTC instant, including daylight saving changes. */
export function localDayStart(dateKey: string): string {
  const target = Date.parse(`${dateKey}T00:00:00Z`);
  let candidate = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const part = (type: string) => parts.find((p) => p.type === type)!.value;
    const wallClock = Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`);
    const delta = target - wallClock;
    if (delta === 0) break;
    candidate += delta;
  }
  return new Date(candidate).toISOString();
}

export function localHour(instant = new Date()): number {
  return Number(new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE, hour: "2-digit", hourCycle: "h23",
  }).format(instant));
}
