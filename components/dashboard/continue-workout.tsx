"use client";
import { useActiveWorkout } from "@/components/workouts/active-workout-context";
import { projectedWorkout } from "@/lib/workouts/model";
export function ContinueWorkout({ serverId }: { serverId: string | null }) {
  const { records }=useActiveWorkout();
  const pendingClose=records.find(r=>r.queue.length && projectedWorkout(r).ended_at);
  const id=pendingClose?.workoutId ?? records.find(r=>!projectedWorkout(r).ended_at)?.workoutId ?? serverId;
  if(!id) return null;
  return <a href={"/workouts/"+id} className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-primary p-4 font-semibold text-primary-foreground">
    <span>{pendingClose?"Revisar sincronización pendiente":"Continuar entrenamiento"}</span><span aria-hidden="true">→</span>
  </a>;
}
