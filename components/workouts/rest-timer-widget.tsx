"use client";

import { TimerIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestTimer } from "@/components/workouts/rest-timer-context";

const REST_STEP_SECONDS = 15;

function formatClock(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function RestTimerWidget() {
  const { secondsLeft, totalSeconds, label, adjust, skip } = useRestTimer();

  if (secondsLeft == null) return null;

  const done = secondsLeft <= 0;
  const progress = totalSeconds ? Math.min(1, 1 - secondsLeft / totalSeconds) : 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3 sm:bottom-4 sm:right-4 sm:left-auto sm:justify-end sm:px-0">
      <div
        className={cn(
          "flex w-full max-w-sm flex-col gap-2 overflow-hidden rounded-xl bg-card/95 p-3 shadow-xl ring-1 backdrop-blur-md",
          done ? "ring-primary/60" : "ring-secondary/40",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TimerIcon className={cn("size-4 shrink-0", done ? "text-primary" : "text-secondary")} />
            <div className="flex flex-col leading-tight">
              <span className={cn("font-mono text-xl font-bold tabular-nums", done ? "text-primary" : "text-secondary")}>
                {done ? "¡Listo!" : formatClock(secondsLeft)}
              </span>
              {label && <span className="truncate text-[11px] text-muted-foreground">{label}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!done && (
              <>
                <button
                  type="button"
                  onClick={() => adjust(-REST_STEP_SECONDS)}
                  className="flex h-7 items-center rounded-md bg-muted px-2 font-mono text-xs hover:bg-muted/70"
                >
                  -15s
                </button>
                <button
                  type="button"
                  onClick={() => adjust(REST_STEP_SECONDS)}
                  className="flex h-7 items-center rounded-md bg-muted px-2 font-mono text-xs hover:bg-muted/70"
                >
                  +15s
                </button>
              </>
            )}
            <button
              type="button"
              onClick={skip}
              aria-label={done ? "Cerrar" : "Saltar descanso"}
              className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
        {!done && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-secondary transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
