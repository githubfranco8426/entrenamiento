"use client";

import { useEffect, useState } from "react";
import { TimerIcon, XIcon, SparklesIcon, PauseIcon, PlayIcon, MinusIcon, PlusIcon, Minimize2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestTimer } from "@/components/workouts/rest-timer-context";

const REST_STEP_DOWN = 15;
const REST_STEP_UP = 30;
const DIAL_RADIUS = 92;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

function formatClock(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

/** Pacer de respiración guiada 4-2-6 (inhalar-retener-exhalar) — puramente visual, sin datos reales. */
function useBreathingPacer(active: boolean) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setTick((t) => (t + 1) % 12), 1000);
    return () => clearInterval(interval);
  }, [active]);

  if (tick < 4) return { label: `Inhalá (${4 - tick}s)`, pct: ((tick + 1) / 4) * 100, tone: "primary" as const };
  if (tick < 6) return { label: `Retené (${6 - tick}s)`, pct: 100, tone: "secondary" as const };
  return { label: `Exhalá (${12 - tick}s)`, pct: (1 - (tick - 5) / 6) * 100, tone: "muted" as const };
}

export function RestTimerWidget() {
  const { secondsLeft, totalSeconds, label, note, cue, nextSet, paused, minimized, adjust, togglePause, toggleMinimized, skip } =
    useRestTimer();
  const breath = useBreathingPacer(secondsLeft != null && !minimized && secondsLeft > 0);

  if (secondsLeft == null) return null;

  const done = secondsLeft <= 0;
  const progress = totalSeconds ? Math.min(1, 1 - secondsLeft / totalSeconds) : 0;

  if (minimized) {
    return (
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3 sm:bottom-4 sm:right-4 sm:left-auto sm:justify-end sm:px-0">
        <div
          className={cn(
            "flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl bg-card/95 p-3 shadow-xl ring-1 backdrop-blur-md",
            done ? "ring-primary/60" : "ring-secondary/40",
          )}
        >
          <button type="button" onClick={toggleMinimized} className="flex flex-1 items-center gap-2 text-left">
            <TimerIcon className={cn("size-4 shrink-0", done ? "text-primary" : "text-secondary")} />
            <div className="flex flex-col leading-tight">
              <span className={cn("font-mono text-xl font-bold tabular-nums", done ? "text-primary" : "text-secondary")}>
                {done ? "¡Listo!" : formatClock(secondsLeft)}
              </span>
              {label && <span className="truncate text-[11px] text-muted-foreground">{label}</span>}
            </div>
          </button>
          <button
            type="button"
            onClick={skip}
            aria-label={done ? "Cerrar" : "Saltar descanso"}
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3 sm:inset-x-auto sm:right-4 sm:bottom-4">
      <div className="flex w-full max-w-sm flex-col gap-3 overflow-hidden rounded-2xl bg-card/95 p-4 shadow-2xl ring-1 ring-primary/30 backdrop-blur-md">
        {/* Status strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              {!done && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              )}
              <span className={cn("relative inline-flex size-2 rounded-full", done ? "bg-primary" : "bg-secondary")} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {done ? "Descanso completo" : "Recuperación activa"}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleMinimized}
            className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Minimize2Icon className="size-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Minimizar</span>
          </button>
        </div>

        {label && <p className="truncate font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>}

        {/* Big dial */}
        <div className="relative mx-auto my-1 flex size-48 items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={DIAL_RADIUS} fill="none" stroke="var(--border)" strokeWidth={6} strokeDasharray="2 6" />
            <circle
              cx="100"
              cy="100"
              r={DIAL_RADIUS}
              fill="none"
              stroke={done ? "var(--primary)" : "var(--secondary)"}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={DIAL_CIRCUMFERENCE}
              strokeDashoffset={DIAL_CIRCUMFERENCE * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {done ? "Iniciá la serie" : "Tiempo restante"}
            </span>
            <span className={cn("font-mono text-4xl font-bold tabular-nums", done ? "text-primary" : "text-foreground")}>
              {formatClock(secondsLeft)}
            </span>
          </div>
        </div>

        {/* Adjust / pause controls */}
        {!done && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjust(-REST_STEP_DOWN)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted py-2 hover:bg-accent"
            >
              <MinusIcon className="size-3.5" />
              <span className="font-mono text-xs uppercase tracking-wide">{REST_STEP_DOWN}s</span>
            </button>
            <button
              type="button"
              onClick={() => adjust(REST_STEP_UP)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted py-2 hover:bg-accent"
            >
              <PlusIcon className="size-3.5" />
              <span className="font-mono text-xs uppercase tracking-wide">{REST_STEP_UP}s</span>
            </button>
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? "Reanudar" : "Pausar"}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted hover:bg-accent"
            >
              {paused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={skip}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),white_12%)]"
        >
          {done ? "Iniciar serie" : "Terminar descanso"}
        </button>

        {/* Next-set prescription (real data only) */}
        {nextSet && (nextSet.weightKg != null || nextSet.repsMin != null || nextSet.rir != null) && (
          <div className="grid grid-cols-3 gap-1.5">
            {nextSet.weightKg != null && (
              <div className="flex flex-col items-center rounded-lg bg-muted px-2 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Carga</span>
                <span className="font-mono text-sm font-semibold">{nextSet.weightKg}kg</span>
              </div>
            )}
            {nextSet.repsMin != null && (
              <div className="flex flex-col items-center rounded-lg bg-muted px-2 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Reps</span>
                <span className="font-mono text-sm font-semibold">
                  {nextSet.repsMin}
                  {nextSet.repsMax && nextSet.repsMax !== nextSet.repsMin ? `-${nextSet.repsMax}` : ""}
                </span>
              </div>
            )}
            {nextSet.rir != null && (
              <div className="flex flex-col items-center rounded-lg bg-muted px-2 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">RIR</span>
                <span className="font-mono text-sm font-semibold text-primary">{nextSet.rir}</span>
              </div>
            )}
          </div>
        )}

        {/* Breathing pacer — visual only, no real biometrics */}
        {!done && (
          <div className="rounded-lg bg-muted px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Respiración guiada</span>
              <span
                className={cn(
                  "font-mono text-[10px] font-semibold uppercase",
                  breath.tone === "primary" && "text-primary",
                  breath.tone === "secondary" && "text-secondary",
                  breath.tone === "muted" && "text-muted-foreground",
                )}
              >
                {breath.label}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000 ease-in-out"
                style={{ width: `${breath.pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Biomechanical cue */}
        {cue && (
          <div className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs text-foreground">{cue}</p>
          </div>
        )}

        {note && (
          <div className="flex items-start gap-1.5 rounded-lg bg-secondary/10 px-2.5 py-2">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-secondary" />
            <p className="text-xs text-foreground">{note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
