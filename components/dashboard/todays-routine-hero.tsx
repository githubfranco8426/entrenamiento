import { ClockIcon, DumbbellIcon, GaugeIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";

interface TargetSet {
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rpe: number | null;
  target_weight_kg: number | null;
}

interface RoutineExercise {
  exercise_id: string;
  order_index: number;
  notes: string | null;
  exercises: { name: string; thumbnail_url: string | null } | null;
  target_sets: TargetSet[];
}

interface Routine {
  id: string;
  title: string;
  day_label: string | null;
  routine_exercises: RoutineExercise[];
}

/** Estimación gruesa: ~2.5 min por serie (trabajo + descanso) para dar una duración orientativa. */
const MINUTES_PER_SET = 2.5;

function effortLabel(avgRpe: number | null): string {
  if (avgRpe == null) return "—";
  if (avgRpe <= 6.5) return "Cómodo";
  if (avgRpe <= 8) return "Moderado";
  return "Exigente";
}

export function TodaysRoutineHero({
  routine,
  daysSinceLastTrained,
  hasActiveMeso,
}: {
  routine: Routine;
  daysSinceLastTrained: number | null;
  hasActiveMeso: boolean;
}) {
  const exercises = [...routine.routine_exercises].sort((a, b) => a.order_index - b.order_index);
  const totalSets = exercises.reduce((sum, re) => sum + re.target_sets.length, 0);
  const rpes = exercises.flatMap((re) => re.target_sets.map((s) => s.target_rpe).filter((r): r is number => r != null));
  const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;
  const estimatedMinutes = totalSets > 0 ? Math.round(totalSets * MINUTES_PER_SET) : null;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#26344a] bg-[#090d16] shadow-[0_26px_65px_-35px_rgba(0,242,254,0.42)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] md:block">
        <Image
          src="/images/performance-os-athlete.png"
          alt="Atleta preparado para su sesión"
          fill
          priority
          sizes="(min-width: 768px) 48vw, 0px"
          className="object-cover object-[72%_34%] opacity-80 saturate-[.9]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#090d16_0%,#090d16_8%,rgba(9,13,22,.35)_47%,rgba(9,13,22,.08)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#090d16_0%,transparent_42%)]" />
      </div>
      <div className="relative grid md:grid-cols-[1.08fr_0.92fr]">
        <div className="relative flex flex-col p-5 sm:p-6 md:border-r md:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
              {hasActiveMeso ? "Sesión programada" : "Próxima sesión"}
            </span>
            <SparklesIcon className="size-5 text-secondary" />
          </div>

          <div className="mt-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Prescripción principal</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">{routine.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {routine.day_label && <span className="font-medium text-secondary">{routine.day_label}</span>}
              {daysSinceLastTrained != null && (
                <span className="font-mono text-xs text-destructive">Última vez hace {daysSinceLastTrained} día{daysSinceLastTrained === 1 ? "" : "s"}</span>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-3">
            <div className="flex flex-col gap-1 px-3 first:pl-0">
              <ClockIcon className="size-4 text-secondary" />
              <span className="font-mono text-base font-semibold">{estimatedMinutes ? `~${estimatedMinutes}` : "—"}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Minutos</span>
            </div>
            <div className="flex flex-col gap-1 px-3">
              <DumbbellIcon className="size-4 text-primary" />
              <span className="font-mono text-base font-semibold">{exercises.length}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Bloques</span>
            </div>
            <div className="flex flex-col gap-1 px-3">
              <GaugeIcon className="size-4 text-primary" />
              <span className="font-mono text-base font-semibold">{effortLabel(avgRpe)}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Esfuerzo</span>
            </div>
          </div>

          <StartWorkoutButton
            routineId={routine.id}
            size="lg"
            className="mt-6 w-full gap-2 rounded-xl font-heading text-base font-bold uppercase tracking-wide shadow-[0_12px_28px_-12px_rgba(0,242,254,0.65)]"
            label="Comenzar rutina"
          />
        </div>

        <div className="relative bg-[#090d16]/50 p-5 backdrop-blur-[1px] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Enfoque de la sesión</p>
              <h3 className="mt-1 font-heading text-lg font-bold">Bloques de hoy</h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{totalSets} series</span>
          </div>

          {exercises.length > 0 && (
            <div className="flex flex-col divide-y divide-white/8">
              {exercises.slice(0, 3).map((re, i) => {
            const sets = [...re.target_sets].sort((a, b) => (a.target_reps_max ?? 0) - (b.target_reps_max ?? 0));
            const first = sets[0];
            const repsLabel =
              first?.target_reps_min != null && first?.target_reps_max != null
                ? `${re.target_sets.length}x${first.target_reps_min}-${first.target_reps_max}`
                : `${re.target_sets.length} series`;
            const weightLabel = first?.target_weight_kg != null ? `${first.target_weight_kg} kg` : null;
            return (
              <div
                key={`${re.exercise_id}-${i}`}
                className="flex items-center gap-3 py-3 first:pt-0"
              >
                <span className="font-mono text-xs font-bold text-primary/70">0{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{re.exercises?.name ?? "Ejercicio"}</p>
                  <p className="truncate text-xs text-muted-foreground">{re.notes ?? repsLabel}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="whitespace-nowrap font-mono text-xs text-secondary">{repsLabel}</span>
                  {weightLabel && (
                    <span className="whitespace-nowrap font-mono text-xs font-bold text-primary">
                      {weightLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
              {exercises.length > 3 && (
            <p className="pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">+{exercises.length - 3} bloques más en la sesión</p>
          )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
