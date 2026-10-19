"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchWithAuthRetry } from "@/lib/supabase/fetch-with-auth-retry";
import { useActiveWorkout } from "@/components/workouts/active-workout-context";
export function StartWorkoutButton({ routineId, className, size="sm", label="Iniciar" }: { routineId?:string; className?:string; size?:"sm"|"default"|"lg"; label?:string }) {
  const router=useRouter();
  const { records, sync }=useActiveWorkout();
  const [loading,setLoading]=useState(false);
  const [existing,setExisting]=useState<string|null>(null);
  const busy=useRef(false);
  async function handleClick() {
    if(busy.current) return;
    if(!navigator.onLine) { toast.error("Para iniciar una sesión nueva necesitás conexión. Podés continuar una sesión guardada."); return; }
    busy.current=true;setLoading(true);
    try {
      if(records.some(r=>r.queue.length)) { await sync(); toast.info("Revisá que tus cambios pendientes estén sincronizados antes de iniciar otra sesión."); return; }
      const active=await fetchWithAuthRetry("/api/workouts?active=true&limit=1");
      if(!active.ok) throw new Error("No se pudo comprobar si hay una sesión abierta.");
      const {workouts}=await active.json();
      if(workouts?.[0]) { setExisting(workouts[0].id); return; }
      const res=await fetchWithAuthRetry("/api/workouts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({routineId:routineId??null})});
      const body=await res.json();
      if(!res.ok) throw new Error(body.error??"No se pudo iniciar");
      if(body.resumed) { setExisting(body.workout.id); return; }
      router.push("/workouts/"+body.workout.id);
    } catch(e) { toast.error(e instanceof Error?e.message:"No se pudo iniciar. Reintentá."); }
    finally {busy.current=false;setLoading(false);}
  }
  return <>
    <Button size={size} className={className} onClick={handleClick} disabled={loading}>{loading?"Preparando…":label}</Button>
    <Dialog open={!!existing} onOpenChange={open=>{if(!open)setExisting(null);}}>
      <DialogContent>
        <DialogTitle>Tenés un entrenamiento abierto</DialogTitle>
        <DialogDescription>Podés continuarlo o revisar su duración y finalizarlo antes de empezar otro.</DialogDescription>
        <Button onClick={()=>router.push("/workouts/"+existing)}>Continuar entrenamiento</Button>
        <Button variant="outline" onClick={()=>router.push("/workouts/"+existing+"?finish=1")}>Revisar y finalizar</Button>
      </DialogContent>
    </Dialog>
  </>;
}
