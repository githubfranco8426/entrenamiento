import { actionSchema, applyAction, blockIdentity, nextSetIndex, type WorkoutAction, type SessionRecord, type WorkoutData } from "./model";
import { changeSession, readSession } from "./storage";

export async function enqueue(userId: string, workoutId: string, action: WorkoutAction, draftKey?: string) {
  const checked = actionSchema.parse(action);
  return changeSession(userId, workoutId, record => {
    if (!record) throw new Error("La sesión todavía no está guardada en este dispositivo.");
    if (record.queue.some(op => op.action.kind === "finish") && checked.kind !== "reopen") throw new Error("Esperá a sincronizar el cierre antes de seguir editando.");
    if (checked.kind === "log") {
      if (record.queue.some(op => op.action.kind === "log" && op.action.setId === checked.setId) || record.payload.workout.workout_exercises.some(b => b.set_logs.some(s => s.id === checked.setId))) return record;
      const key = blockIdentity(checked.exerciseId, checked.routineExerciseId);
      if (draftKey && checked.setIndex < nextSetIndex(record, checked.exerciseId, checked.routineExerciseId)) throw new Error("Esta serie ya se registró. Revisá la siguiente serie.");
      checked.setIndex = nextSetIndex(record, checked.exerciseId, checked.routineExerciseId);
      record.nextIndexes[key] = checked.setIndex + 1;
    }
    record.queue.push({ id: crypto.randomUUID(), expectedRevision: record.payload.workout.revision + record.queue.length, action: checked });
    if (draftKey) delete record.drafts[draftKey];
    record.updatedAt = Date.now();
    return record;
  });
}

type Transport = (url: string, init?: RequestInit) => Promise<Response>;
const running = new Map<string, Promise<void>>();
export function syncSession(userId: string, workoutId: string, transport: Transport, isCurrentUser: () => boolean = () => true) {
  const key = `${userId}:${workoutId}`;
  if (running.has(key)) return running.get(key)!;
  async function drain() {
    for (;;) {
      if (!isCurrentUser()) return;
      const record = await readSession(userId, workoutId);
      const op = record?.queue[0];
      if (!record || !op || record.issue?.conflict) return;
      let response: Response;
      try {
        response = await transport(`/api/workouts/${workoutId}/sync`, { method: "POST", headers: { "Content-Type": "application/json", "X-Workout-User": userId }, body: JSON.stringify(op), signal: AbortSignal.timeout(15000) });
      } catch { return; } // The durable queue remains intact, including after an ambiguous timeout.
      if (!isCurrentUser()) return;
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        await changeSession(userId, workoutId, current => {
          if (current?.queue[0]?.id === op.id) current.issue = { message: response.status === 401 ? "Iniciá sesión de nuevo para sincronizar. Tus series siguen guardadas." : body.error ?? "No se pudo sincronizar. Reintentá cuando haya conexión.", conflict: response.status === 409 || response.status === 400 || response.status === 404 };
          return current;
        });
        return;
      }
      await changeSession(userId, workoutId, current => {
        if (!current || current.queue[0]?.id !== op.id) return current;
        current.payload.workout = applyAction(current.payload.workout, op.action, current.payload.allExercises);
        current.payload.workout.revision = body.revision;
        current.queue.shift();
        current.issue = undefined;
        return current;
      });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("workout-synced"));
      // Keep the existing autoregulation behavior, without delaying the durable queue.
      const action = op.action;
      if (action.kind === "log" && Date.now() - Date.parse(action.completedAt) < 5 * 60000) {
        const exercise = record.payload.workout.routines?.routine_exercises.find(e => e.id === action.routineExerciseId);
        const target = exercise?.target_sets.find(s => s.id === action.targetSetId);
        if (target?.target_rpe) void transport("/api/autoregulate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setLogId: action.setId, targetReps: target.target_reps_max ?? target.target_reps_min ?? action.reps, targetRpe: target.target_rpe, actualWeightKg: action.weightKg, actualReps: action.reps, actualRpe: action.rpeActual, plateIncrementKg: exercise?.exercises?.plate_increment_kg ?? 2.5 }),
        }).then(res => res.ok ? res.json() : null).then(suggestion => {
          if (suggestion && isCurrentUser() && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("workout-suggestion", { detail: { userId, label: exercise?.exercises?.name, note: suggestion.rationale } }));
        }).catch(() => {});
      }
    }
  }
  const promise: Promise<void> = Promise.resolve(typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request(`workout-sync:${key}`, drain) : drain()).then(() => {}).finally(() => running.delete(key));
  running.set(key, promise);
  return promise;
}

// Explicit conflict resolution. Only the first operation is resolved; later edits remain queued.
export async function resolveConflict(userId: string, workoutId: string, server: WorkoutData, keepLocal: boolean) {
  if (server.user_id !== userId || server.id !== workoutId) throw new Error("Sesión incorrecta");
  return changeSession(userId, workoutId, record => {
    if (!record) return record;
    record.payload.workout = server;
    if (!keepLocal) record.queue.shift();
    const pending = record.queue;
    record.queue = [];
    for (const op of pending) {
      const action = { ...op.action };
      if (action.kind === "log") {
        if (server.workout_exercises.some(b => b.set_logs.some(s => s.id === action.setId))) continue;
        action.setIndex = nextSetIndex(record, action.exerciseId, action.routineExerciseId);
        record.nextIndexes[blockIdentity(action.exerciseId, action.routineExerciseId)] = action.setIndex + 1;
      }
      record.queue.push({ ...op, action, id: crypto.randomUUID(), expectedRevision: server.revision + record.queue.length });
    }
    record.issue = undefined;
    return record;
  });
}

export function syncLabel(record: SessionRecord) {
  return record.issue ? "Requiere atención" : record.queue.length ? "Guardada en dispositivo" : "Sincronizada";
}
