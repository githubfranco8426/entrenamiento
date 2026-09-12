"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DumbbellIcon, CheckIcon } from "lucide-react";
import { fetchWithAuthRetry } from "@/lib/supabase/fetch-with-auth-retry";
import { useActiveWorkout } from "@/components/workouts/active-workout-context";

/**
 * Barra flotante visible en cualquier pantalla de la app mientras hay un entrenamiento
 * abierto — no reemplaza una Live Activity de iOS (imposible desde una PWA, requiere una
 * app nativa con ActivityKit), pero da el mismo vistazo rápido dentro de la app: ejercicio
 * actual, serie X de Y, y un check para confirmarla sin abrir la sesión completa.
 * Se oculta en la propia pantalla del entreno (ahí ya está la fila del set completa).
 */
export function ActiveSetWidget() {
  const { state } = useActiveWorkout();
  const pathname = usePathname();
  const router = useRouter();
  const [logging, setLogging] = useState(false);

  if (!state) return null;
  if (pathname === `/workouts/${state.workoutId}`) return null;

  async function handleQuickLog() {
    if (!state?.quickLog) return;
    setLogging(true);
    const res = await fetchWithAuthRetry(`/api/workouts/${state.workoutId}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: state.quickLog.exerciseId,
        routineExerciseId: state.quickLog.routineExerciseId,
        targetSetId: state.quickLog.targetSetId,
        setIndex: state.setNumber - 1,
        weightKg: state.quickLog.weightKg,
        reps: state.quickLog.reps,
        rpeActual: state.quickLog.rpeActual,
      }),
    });
    setLogging(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
      toast.error(error);
      return;
    }
    toast.success("Serie registrada");
    router.push(`/workouts/${state.workoutId}`);
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3 sm:bottom-24 sm:right-4 sm:left-auto sm:justify-end sm:px-0">
      <div className="flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl bg-card/95 p-3 shadow-xl ring-1 ring-primary/40 backdrop-blur-md">
        <Link
          href={`/workouts/${state.workoutId}`}
          className="flex flex-1 items-center gap-3 rounded-lg py-0.5 pl-0.5"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <DumbbellIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">{state.exerciseName}</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Serie {state.setNumber} de {state.totalSets}
              {state.quickLog && ` · ${state.quickLog.weightKg}kg × ${state.quickLog.reps}`}
            </p>
          </div>
        </Link>
        {state.quickLog && (
          <button
            type="button"
            onClick={handleQuickLog}
            disabled={logging}
            aria-label="Registrar serie"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),white_12%)] disabled:opacity-50"
          >
            <CheckIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
