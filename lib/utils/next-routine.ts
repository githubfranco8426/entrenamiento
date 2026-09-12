export interface RoutineLike {
  id: string;
}

export interface WorkoutLike {
  routine_id: string | null;
  started_at: string;
}

/**
 * Elige qué rutina sugerir a continuación: la que lleva más tiempo sin entrenarse.
 * Una rutina que no aparece en `workouts` (no se entrenó en las sesiones recientes)
 * gana prioridad sobre cualquiera que sí aparece, sin importar cuándo.
 */
export function pickNextRoutine<T extends RoutineLike>(
  routines: T[],
  workouts: WorkoutLike[],
): T | undefined {
  const lastTrainedByRoutine = new Map<string, string>();
  for (const w of workouts) {
    if (w.routine_id && !lastTrainedByRoutine.has(w.routine_id)) {
      lastTrainedByRoutine.set(w.routine_id, w.started_at);
    }
  }

  return [...routines].sort((a, b) => {
    const da = lastTrainedByRoutine.get(a.id);
    const db = lastTrainedByRoutine.get(b.id);
    if (!da && !db) return 0;
    if (!da) return -1;
    if (!db) return 1;
    return da.localeCompare(db);
  })[0];
}
