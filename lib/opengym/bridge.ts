import { createHash } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import { localDateKey } from "@/lib/utils/local-date";
import { EMPTY_STATE, StateSchema, routineSignature, type OpenGymState } from "./state";
import library from "@/vendor/opengym/coach/library.json";

type Client = Awaited<ReturnType<typeof createClient>>;
const catalogue = new Map(library.exercises.map(e => [e.id, e]));
const PREFIX = "training:";
export function bridgeId(userId: string, kind: string, source: string) {
  const h = createHash("sha256").update(JSON.stringify(["opengym-v1", userId, kind, source])).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}

/** Pull a bounded, user-filtered snapshot; fail explicitly at the import limit. */
export async function trainingSeed(client: Client, userId: string): Promise<OpenGymState> {
  const [exercises, routines, workouts, metrics] = await Promise.all([
    client.from("exercises").select("id,name,muscle_group,equipment").eq("user_id", userId).order("id"),
    client.from("routines").select("id,title,routine_exercises(exercise_id,order_index,target_sets(*))").eq("user_id", userId).order("order_index"),
    client.from("workouts").select("id,started_at,ended_at,routine_id,routines(title),workout_exercises(exercise_id,order_index,set_logs(*))").eq("user_id", userId).not("ended_at", "is", null).order("started_at").limit(1000),
    client.from("body_metrics").select("id,log_date,weight_kg").eq("user_id", userId).not("weight_kg", "is", null).order("log_date").limit(1000),
  ]);
  for (const result of [exercises, routines, workouts, metrics]) if (result.error) throw new Error(result.error.message);
  // This explicit bound is surfaced to users rather than claiming a complete import.
  if ((workouts.data?.length ?? 0) >= 1000 || (metrics.data?.length ?? 0) >= 1000 || (exercises.data?.length ?? 0) >= 1000 || (routines.data?.length ?? 0) >= 1000) throw new Error("Tu historial supera el límite de importación (1000 registros). Exporta un bloque menor antes de importar.");
  const rs = (routines.data ?? []).map(r => ({
    id: PREFIX + r.id, name: r.title,
    ex: [...r.routine_exercises].sort((a,b) => a.order_index - b.order_index).map(e => {
      const targets = [...e.target_sets].sort((a,b) => a.set_index-b.set_index);
      return { id: PREFIX + e.exercise_id, sets: targets.length || 1, reps: targets[0]?.target_reps_max ?? targets[0]?.target_reps_min ?? 10, weight: targets[0]?.target_weight_kg ?? 0 };
    }),
  }));
  return StateSchema.parse({
    ...EMPTY_STATE, _ts: Date.now(),
    customEx: (exercises.data ?? []).map(e => ({ id: PREFIX + e.id, n: e.name, bp: e.muscle_group ?? "", eq: e.equipment ?? "" })),
    routines: rs,
    workouts: (workouts.data ?? []).map(w => ({
      id: PREFIX + w.id, d: localDateKey(w.started_at), start: Date.parse(w.started_at), end: Date.parse(w.ended_at!),
      routineId: w.routine_id ? PREFIX+w.routine_id : null, name: w.routines?.title ?? "Entreno libre",
      vol:w.workout_exercises.reduce((total,e)=>total+e.set_logs.reduce((sum,s)=>sum+(s.weight_kg ?? 0)*(s.reps ?? 0),0),0),
      entries: [...w.workout_exercises].sort((a,b)=>a.order_index-b.order_index).map(e => ({
        id: PREFIX+e.exercise_id,
        sets: [...e.set_logs].sort((a,b)=>a.set_index-b.set_index).map(s=>({ done:true, w:s.weight_kg ?? 0, r:s.reps ?? 0, ...(s.rpe_actual != null ? { rpe:s.rpe_actual } : {}) })),
      })),
    })),
    bodyweight: (metrics.data ?? []).map(m => ({ id: PREFIX+m.id, d:m.log_date, w:m.weight_kg })),
    _trainingBase: Object.fromEntries(rs.map(r => [r.id, routineSignature(r)])),
  });
}

/** A conservative bridge: publish copies; never mutate or delete existing training data. */
export function publishRecords(state: OpenGymState, userId: string) {
  const key = (kind: string, source: string) => bridgeId(userId, kind, source);
  const custom = new Map(state.customEx.map(e => [e.id,e]));
  const base = (state._trainingBase ?? {}) as Record<string,string>;
  const routines = state.routines.filter(r => !r.id.startsWith(PREFIX) || base[r.id] !== routineSignature(r));
  const workouts = state.workouts.filter(w => !w.id.startsWith(PREFIX) && w.end && w.end >= w.start);
  const used = new Set([...routines.flatMap(r=>r.ex.map(e=>e.id)), ...workouts.flatMap(w=>w.entries.map(e=>e.id))]);
  const exercises = [...used].map(id => {
    const ex = custom.get(id) ?? catalogue.get(id);
    if (!ex) throw new Error(`Ejercicio desconocido: ${id}`);
    return { id:key("exercise",id), name:ex.n, muscle_group:ex.bp, equipment:ex.eq ?? null };
  });
  const routineRows = routines.map((r,i) => ({ id:key("routine",r.id), title:r.name, order_index:i }));
  const routineExercises = routines.flatMap(r=>r.ex.map((e,i)=>({ id:key("routine-exercise",r.id+":"+i), routine_id:key("routine",r.id), exercise_id:key("exercise",e.id), order_index:i, notes:e.mode && e.mode !== "reps" ? "Ejercicio por tiempo/cardio: consultar objetivos en OpenGym." : null })));
  const targetSets = routines.flatMap(r=>r.ex.flatMap((e,i)=> Array.from({length:e.sets}, (_,j)=>({
    id:key("target",r.id+":"+i+":"+j), routine_exercise_id:key("routine-exercise",r.id+":"+i), set_index:j,
    target_reps_min: e.mode === "time" || e.mode === "cardio" ? null : e.repsMin ?? e.reps ?? null,
    target_reps_max: e.mode === "time" || e.mode === "cardio" ? null : e.reps ?? null,
    target_weight_kg:e.weight != null ? Math.round(e.weight*(state.unit === "lb" ? 0.45359237 : 1)*100)/100 : null,
  }))));
  const workoutRows = workouts.map(w=>({id:key("workout",w.id), started_at:new Date(w.start).toISOString(), ended_at:new Date(w.end!).toISOString(), notes:`OpenGym · ${w.name ?? "Entrenamiento"}` }));
  const workoutExercises = workouts.flatMap(w=>w.entries.map((e,i)=>({id:key("workout-exercise",w.id+":"+i), workout_id:key("workout",w.id), exercise_id:key("exercise",e.id), order_index:i })));
  const setLogs = workouts.flatMap(w=>w.entries.flatMap((e,i)=>e.sets.filter(s=>s.done).map((s,j)=>({
    id:key("set",w.id+":"+i+":"+j),workout_exercise_id:key("workout-exercise",w.id+":"+i),set_index:j,
    weight_kg:s.w != null ? Math.round(s.w*(state.unit === "lb" ? 0.45359237 : 1)*100)/100 : null,reps:s.r ?? null,
    rpe_actual:s.rpe != null ? Math.max(5,s.rpe) : s.rir != null ? Math.max(5,10-s.rir) : null,
    completed_at:new Date(w.end!).toISOString(),
  }))));
  return { exercises, routines:routineRows, routine_exercises:routineExercises, target_sets:targetSets, workouts:workoutRows, workout_exercises:workoutExercises, set_logs:setLogs,
    body_metrics:state.bodyweight.filter(m=>!m.id?.startsWith(PREFIX)).map(m=>({id:key("metric",m.id ?? m.d),log_date:m.d,weight_kg:Math.round(m.w*(state.unit === "lb" ? 0.45359237 : 1)*100)/100})) };
}
