"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, ChevronDownIcon, DumbbellIcon, HouseIcon, LayersIcon, PlusIcon } from "lucide-react";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { cn } from "@/lib/utils";

interface LibraryRoutine {
  id: string;
  title: string;
  dayLabel: string | null;
  exercises: { id: string; name: string; sets: number }[];
}

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "gym", label: "Gimnasio" },
  { id: "home", label: "Casa" },
] as const;

const FOCUS_LABELS: Record<string, string> = {
  push: "Empuje", pull: "Tracción", legs: "Pierna", "home legs (kb)": "Pierna",
  "home push": "Empuje", "home pull": "Tracción", "upper": "Tren superior", "lower": "Tren inferior",
};

function isHome(routine: LibraryRoutine) {
  return /\b(casa|home)\b/i.test(`${routine.title} ${routine.dayLabel ?? ""}`);
}

export function RoutineLibrary({ routines, nextRoutineId }: { routines: LibraryRoutine[]; nextRoutineId?: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const visible = routines.filter((routine) => filter === "all" || (filter === "home" ? isHome(routine) : !isHome(routine)));

  return (
    <section aria-labelledby="routine-library-heading" className="min-w-0 space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tu biblioteca</p>
          <h2 id="routine-library-heading" className="mt-1 font-heading text-2xl font-bold tracking-tight">Todas las rutinas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Elegí cómo querés entrenar hoy.</p>
        </div>
        <Link href="/routines" aria-label="Gestionar mis rutinas" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <ArrowUpRightIcon className="size-5" aria-hidden="true" />
        </Link>
      </header>

      <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/70 p-1" role="group" aria-label="Filtrar rutinas por lugar">
        {FILTERS.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cn("min-h-11 min-w-0 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", filter === id ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      <p aria-live="polite" aria-atomic="true" className="text-xs text-muted-foreground">
        {visible.length} {visible.length === 1 ? "rutina disponible" : "rutinas disponibles"}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((routine) => {
          const home = isHome(routine);
          const Icon = home ? HouseIcon : DumbbellIcon;
          const next = routine.id === nextRoutineId;
          const totalSets = routine.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
          const focus = routine.dayLabel ? FOCUS_LABELS[routine.dayLabel.trim().toLowerCase()] ?? routine.dayLabel : null;

          return (
            <article key={routine.id} aria-labelledby={`routine-${routine.id}`} className={cn("relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card bg-linear-to-br from-white/[0.035] to-transparent p-5", next ? "border-primary/40 shadow-[0_8px_32px_-20px_rgba(0,242,254,0.35)]" : "border-border/80")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className={cn("flex size-11 items-center justify-center rounded-xl", home ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary")}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {next ? <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Próxima sesión</span> : <span className="text-xs text-muted-foreground">{home ? "En casa" : "Gimnasio"}</span>}
              </div>

              <h3 id={`routine-${routine.id}`} className="break-words font-heading text-lg leading-snug font-bold tracking-tight">{routine.title}</h3>
              {focus ? <p className="mt-1.5 text-xs font-medium text-muted-foreground">{focus}{next ? ` · ${home ? "En casa" : "Gimnasio"}` : ""}</p> : null}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><DumbbellIcon className="size-3.5" aria-hidden="true" />{routine.exercises.length} {routine.exercises.length === 1 ? "ejercicio" : "ejercicios"}</span>
                {totalSets > 0 ? <span className="inline-flex items-center gap-1.5"><LayersIcon className="size-3.5" aria-hidden="true" />{totalSets} series</span> : null}
              </div>

              {routine.exercises.length > 0 ? (
                <details className="group mt-4 border-t border-border/70">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                    Ver ejercicios<span className="sr-only"> de {routine.title}</span>
                    <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                  </summary>
                  <ol className="mb-4 space-y-3 border-t border-border/50 pt-3">
                    {routine.exercises.map((exercise, index) => (
                      <li key={`${exercise.id}-${index}`} className="flex items-start gap-2 text-xs leading-relaxed">
                        <span className="w-4 shrink-0 pt-px font-mono text-[10px] text-muted-foreground" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1 break-words">{exercise.name}</span>
                        {exercise.sets > 0 ? <span className="shrink-0 text-muted-foreground">{exercise.sets} series</span> : null}
                      </li>
                    ))}
                  </ol>
                </details>
              ) : <p className="mt-4 text-xs text-muted-foreground">Sin ejercicios configurados.</p>}

              <div className="mt-auto pt-3">
                <StartWorkoutButton routineId={routine.id} size="lg" className={cn("w-full rounded-xl text-sm font-semibold", !next && "border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20")} label="Iniciar rutina" />
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
          <DumbbellIcon className="mx-auto mb-3 size-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">{routines.length === 0 ? "Tu próxima rutina empieza acá" : "No hay rutinas en esta categoría"}</p>
          <Link href="/routines" className="mt-2 inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">Crear o gestionar rutinas</Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-muted/40 p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground"><PlusIcon className="size-5" aria-hidden="true" /></span>
          <div><h3 className="text-sm font-semibold">A tu manera</h3><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Entrená libre y agregá ejercicios sobre la marcha.</p></div>
        </div>
        <StartWorkoutButton size="lg" className="w-full rounded-xl border border-border bg-accent text-sm text-foreground hover:bg-accent/70 sm:w-auto" label="Empezar entreno libre" />
      </div>
    </section>
  );
}
