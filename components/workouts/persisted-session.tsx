"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useActiveWorkout } from "./active-workout-context";
import { WorkoutSession } from "./workout-session";
import { cacheSession, changeSession } from "@/lib/workouts/storage";
import { projectedWorkout, type SessionPayload, type SessionRecord } from "@/lib/workouts/model";
import { syncLabel, resolveConflict } from "@/lib/workouts/sync";
import { fetchWithAuthRetry } from "@/lib/supabase/fetch-with-auth-retry";
import { toast } from "sonner";

const DraftContext = createContext<SessionRecord | null>(null);
export function useSetDraft(key: string, defaults: {weight: string; reps: string; rir: string}) {
  const record = useContext(DraftContext);
  const [draft, setDraft] = useState(record?.drafts[key] ?? defaults);
  function update(field: keyof typeof defaults, value: string) {
    setDraft(prev => ({ ...prev, [field]: value }));
    if (record) void changeSession(record.userId, record.workoutId, current => {
      if (current) current.drafts[key] = { ...(current.drafts[key] ?? defaults), [field]: value };
      return current;
    }).catch(() => toast.error("No se pudo guardar el borrador en el dispositivo."));
  }
  return { ...draft, setWeight: (v:string) => update("weight",v), setReps: (v:string) => update("reps",v), setRir: (v:string) => update("rir",v) };
}

export function PersistedSession({ initial }: { initial: SessionPayload }) {
  const { userId, records, sync } = useActiveWorkout();
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);
  useEffect(() => {
    if (initial.workout.user_id !== userId) return;
    void cacheSession(initial).then(() => sync()).catch(() => setError("No se pudo preparar el guardado en este dispositivo. Liberá espacio y recargá antes de registrar series."));
  }, [initial, userId, sync]);
  const record = records.find(r => r.workoutId === initial.workout.id);
  if (error) return <p role="alert">{error}</p>;
  if (!record) return <p role="status">Preparando sesión en este dispositivo…</p>;
  const workout = projectedWorkout(record);
  async function resolve(keepLocal: boolean) {
    setResolving(true);
    try {
      const res = await fetchWithAuthRetry("/api/workouts/" + initial.workout.id);
      if (!res.ok) throw new Error("Conectate con tu cuenta para revisar la versión guardada.");
      const { workout: server } = await res.json();
      await resolveConflict(userId, initial.workout.id, server, keepLocal);
      await sync();
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo resolver"); }
    finally { setResolving(false); }
  }
  const action = record.queue[0]?.action;
  const description = action?.kind === "log" || action?.kind === "edit" ? (action.weightKg + " kg × " + action.reps + " repeticiones") : action?.kind === "delete" ? "Eliminar una serie" : action?.kind === "finish" ? "Finalizar: " + action.durationMinutes + " minutos" : "Reabrir entrenamiento";
  return <DraftContext.Provider value={record}>
    <div className="mb-4 rounded-xl border border-border bg-card p-3 text-sm" role="status" aria-live="polite">
      <span className="font-semibold">{syncLabel(record)}</span>
      {record.queue.length > 0 && <span> · {record.queue.length} cambio(s) pendiente(s){workout.ended_at ? " · Cierre pendiente de sincronización" : ""}</span>}
      {record.issue && <p className="mt-1 text-muted-foreground">{record.issue.message}</p>}
      {record.issue?.conflict ? <div className="mt-3 flex flex-wrap gap-2">
        <p className="w-full">Cambio pendiente: {description}. Aplicar conserva tu cambio sobre la versión actual; descartar elimina solo este cambio pendiente.</p>
        <button className="min-h-11 rounded-lg border px-3" disabled={resolving} onClick={() => resolve(true)}>Aplicar mi cambio</button>
        <button className="min-h-11 rounded-lg border px-3" disabled={resolving} onClick={() => resolve(false)}>Descartar este cambio</button>
      </div> : record.issue && <button className="min-h-11 underline" onClick={() => void sync()}>Reintentar sincronización</button>}
    </div>
    <WorkoutSession {...record.payload} workout={workout} record={record} />
  </DraftContext.Provider>;
}
