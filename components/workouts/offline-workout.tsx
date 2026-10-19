"use client";
import { useEffect, useState } from "react";
import { ActiveWorkoutProvider, OFFLINE_USER_KEY } from "./active-workout-context";
import { RestTimerProvider } from "./rest-timer-context";
import { TrainingDock } from "./training-dock";
import { PersistedSession } from "./persisted-session";
import { listSessions } from "@/lib/workouts/storage";
import type { SessionPayload } from "@/lib/workouts/model";
export function OfflineWorkout() {
  const [payload,setPayload]=useState<SessionPayload|null>(null);
  const [message,setMessage]=useState("Buscando la sesión guardada…");
  useEffect(() => {
    const userId=localStorage.getItem(OFFLINE_USER_KEY);
    const requested=new URLSearchParams(location.search).get("workout");
    void (userId ? listSessions(userId) : Promise.resolve([])).then(records => {
      if (!userId) { setMessage("Iniciá sesión con conexión para preparar tu entrenamiento."); return; }
      const record=requested ? records.find(r=>r.workoutId===requested) : records.find(r=>!r.payload.workout.ended_at || r.queue.length);
      if(record) setPayload(record.payload);
      else setMessage("No hay una sesión preparada en este dispositivo. Abrila con conexión primero.");
    }).catch(()=>setMessage("No se pudo acceder al almacenamiento de este dispositivo."));
  },[]);
  if(!payload) return <main className="p-6"><p role="status">{message}</p><a className="underline" href="/dashboard">Volver al panel</a></main>;
  return <ActiveWorkoutProvider userId={payload.workout.user_id}><RestTimerProvider userId={payload.workout.user_id}>
    <main className="mx-auto w-full max-w-4xl p-4 pb-48">
      <p className="mb-4 text-sm text-muted-foreground">Sesión guardada en este dispositivo · Los cambios se enviarán al recuperar conexión.</p>
      <PersistedSession initial={payload}/>
      <a className="mt-4 block underline" href="/dashboard">Volver al panel</a>
    </main><TrainingDock/>
  </RestTimerProvider></ActiveWorkoutProvider>;
}
