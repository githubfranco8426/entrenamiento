"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchWithAuthRetry } from "@/lib/supabase/fetch-with-auth-retry";
import { cacheSession, listSessions, readSession, SESSION_EVENT } from "@/lib/workouts/storage";
import { projectedWorkout, nextSetIndex, type SessionRecord } from "@/lib/workouts/model";
import { syncSession } from "@/lib/workouts/sync";

export const OFFLINE_USER_KEY = "training-offline-user";
interface ActiveState {
  workoutId: string; exerciseName: string; setNumber: number; totalSets: number;
  quickLog: { exerciseId: string; routineExerciseId: string | null; targetSetId: string | null; weightKg: number; reps: number; rpeActual: number; restSeconds: number } | null;
}
interface ContextValue { userId: string; records: SessionRecord[]; state: ActiveState | null; sync: () => Promise<void> }
const Context = createContext<ContextValue | null>(null);
export function ActiveWorkoutProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [authorized, setAuthorized] = useState(true);
  const current = useRef(userId);
  const router = useRouter();
  const sync = useCallback(async () => {
    if (!navigator.onLine || current.current !== userId) return;
    for (const record of await listSessions(userId)) {
      await syncSession(userId, record.workoutId, fetchWithAuthRetry, () => current.current === userId);
      const latest = await readSession(userId, record.workoutId);
      if (!latest || latest.queue.length || latest.payload.workout.ended_at || current.current !== userId) continue;
      try {
        const response = await fetchWithAuthRetry("/api/workouts/" + record.workoutId, { signal: AbortSignal.timeout(10000) });
        if (!response.ok || current.current !== userId) continue;
        const { workout } = await response.json();
        if (workout.user_id === userId && workout.revision > latest.payload.workout.revision) {
          await cacheSession({ ...latest.payload, workout });
          window.dispatchEvent(new Event("workout-synced"));
        }
      } catch { /* The saved session remains usable when the server cannot be reached. */ }
    }
  }, [userId]);
  useEffect(() => {
    current.current = userId;
    localStorage.setItem(OFFLINE_USER_KEY, userId);
    let alive = true;
    const refresh = () => { void listSessions(userId).then(rows => { if (alive && current.current === userId) setRecords(rows); }).catch(() => {}); };
    const run = () => { refresh(); void sync().catch(() => {}); };
    const visible = () => { if (document.visibilityState === "visible") run(); };
    const channel = new BroadcastChannel(SESSION_EVENT);
    channel.onmessage = refresh;
    window.addEventListener(SESSION_EVENT, refresh);
    window.addEventListener("online", run);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", visible);
    const interval = setInterval(run, 15000);
    let refreshTimer: ReturnType<typeof setTimeout>;
    const synced = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => { if (current.current === userId && navigator.onLine && location.pathname !== "/offline-workout") router.refresh(); }, 300);
    };
    window.addEventListener("workout-synced", synced);
    const auth = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session && session.user.id !== userId)) {
        current.current = "";
        if (localStorage.getItem(OFFLINE_USER_KEY) === userId) localStorage.removeItem(OFFLINE_USER_KEY);
        setRecords([]); setAuthorized(false);
        localStorage.removeItem("rest-timer-v2:" + userId);
      }
    });
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    run();
    return () => {
      alive = false; current.current = ""; channel.close(); auth.data.subscription.unsubscribe();
      window.removeEventListener(SESSION_EVENT, refresh); window.removeEventListener("online", run); window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", visible); window.removeEventListener("workout-synced", synced); clearInterval(interval); clearTimeout(refreshTimer);
    };
  }, [userId, router, sync]);
  const active = records.find(r => !projectedWorkout(r).ended_at);
  let state: ActiveState | null = null;
  if (active) {
    const workout = projectedWorkout(active);
    const routine = [...(workout.routines?.routine_exercises ?? [])].sort((a,b) => a.order_index-b.order_index);
    const pending = routine.find(re => (workout.workout_exercises.find(w => w.routine_exercise_id === re.id)?.set_logs.length ?? 0) < re.target_sets.length);
    const count = pending ? workout.workout_exercises.find(w => w.routine_exercise_id === pending.id)?.set_logs.length ?? 0 : 0;
    const target = pending ? [...pending.target_sets].sort((a,b) => a.set_index-b.set_index)[count] : null;
    const draft = pending ? active.drafts[pending.id + ":" + nextSetIndex(active, pending.exercise_id, pending.id)] : null;
    const weight = draft ? Number(draft.weight) : target?.target_weight_kg;
    const reps = draft ? Number(draft.reps) : target?.target_reps_max ?? target?.target_reps_min;
    const rpe = draft ? Math.max(5, Math.min(10, 10 - Number(draft.rir))) : target?.target_rpe ?? 8;
    state = { workoutId: workout.id, exerciseName: pending?.exercises?.name ?? workout.routines?.title ?? "Entrenamiento en curso", setNumber: pending ? nextSetIndex(active, pending.exercise_id, pending.id) + 1 : 1, totalSets: pending?.target_sets.length ?? 0,
      quickLog: pending && target && weight != null && Number.isFinite(weight) && weight >= 0 && reps != null && Number.isInteger(reps) && reps > 0 && Number.isFinite(rpe) && (!draft || (draft.weight !== "" && draft.reps !== "" && draft.rir !== "")) && !active.issue
        ? { exerciseId: pending.exercise_id, routineExerciseId: pending.id, targetSetId: target.id, weightKg: weight, reps, rpeActual: rpe, restSeconds: target.rest_seconds ?? 90 } : null };
  }
  return <Context.Provider value={{ userId, records, state, sync }}>{authorized ? children : <p className="p-6">Sesión cerrada. <a href="/login">Volver a iniciar sesión</a></p>}</Context.Provider>;
}
export function useActiveWorkout() { const value = useContext(Context); if (!value) throw new Error("Falta ActiveWorkoutProvider"); return value; }
