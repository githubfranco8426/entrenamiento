import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { cacheSession, changeSession, listSessions, readSession } from "./storage";
import { enqueue, syncSession, resolveConflict } from "./sync";
import { projectedWorkout, type SessionPayload, type WorkoutAction } from "./model";
function fixture(): SessionPayload {
  return { workout: { id:crypto.randomUUID(),user_id:crypto.randomUUID(),revision:0,started_at:"2026-10-18T23:30:00Z",ended_at:null,routines:null,workout_exercises:[] },allExercises:[{id:crypto.randomUUID(),name:"Flexiones",plate_increment_kg:0.5,thumbnail_url:null,video_url:null}],estimatedOneRepMaxByExercise:{},acwr:null,nextRoutineLabel:null };
}
function action(p:SessionPayload):WorkoutAction { return {kind:"log",setId:crypto.randomUUID(),exerciseId:p.allExercises[0].id,routineExerciseId:null,targetSetId:null,setIndex:0,completedAt:"2026-10-19T00:00:00Z",weightKg:0,reps:12,rpeActual:8}; }
describe("durable session queue",()=>{
  it("survives network loss and reopening, with drafts and 0 kg",async()=>{
    const p=fixture(),{id,user_id}=p.workout; await cacheSession(p);
    await changeSession(user_id,id,r=>{r!.drafts.next={weight:"0",reps:"12",rir:"2"};return r;});
    await enqueue(user_id,id,action(p));
    await syncSession(user_id,id,async()=>{throw new Error("offline");});
    const restored=await readSession(user_id,id);
    expect(restored!.queue).toHaveLength(1); expect(restored!.drafts.next.weight).toBe("0");
    expect(projectedWorkout(restored!).workout_exercises[0].set_logs[0].weight_kg).toBe(0);
    await cacheSession(p); expect((await readSession(user_id,id))!.queue).toHaveLength(1);
  });
  it("replays the same operation after a lost response without duplicating, even with concurrent sync calls",async()=>{
    const p=fixture(),{id,user_id}=p.workout;await cacheSession(p);const a=action(p);await enqueue(user_id,id,a);await enqueue(user_id,id,a);
    const server=new Map<string,number>();let lose=true;
    const transport=async(_url:string,init?:RequestInit)=>{ const op=JSON.parse(init!.body as string);if(!server.has(op.id))server.set(op.id,server.size+1);if(lose){lose=false;throw new Error("response lost");}return Response.json({revision:server.get(op.id)}); };
    await syncSession(user_id,id,transport);
    await Promise.all([syncSession(user_id,id,transport),syncSession(user_id,id,transport)]);
    expect(server.size).toBe(1);const r=(await readSession(user_id,id))!;expect(r.queue).toHaveLength(0);expect(r.payload.workout.workout_exercises[0].set_logs).toHaveLength(1);
  });
  it("serializes log, edit, delete and finish, preserving high-water indices",async()=>{
    const p=fixture(),{id,user_id}=p.workout;await cacheSession(p);const a=action(p);if(a.kind!=="log")throw Error();
    await enqueue(user_id,id,a);await enqueue(user_id,id,{kind:"edit",setId:a.setId,weightKg:0,reps:15,rpeActual:7});await enqueue(user_id,id,{kind:"delete",setId:a.setId});
    await enqueue(user_id,id,action(p));await enqueue(user_id,id,{kind:"finish",durationMinutes:43});
    const r=(await readSession(user_id,id))!; expect(projectedWorkout(r).workout_exercises[0].set_logs[0].set_index).toBe(1);
    const revisions:number[]=[];await syncSession(user_id,id,async(_url,init)=>{const op=JSON.parse(init!.body as string);revisions.push(op.expectedRevision);return Response.json({revision:op.expectedRevision+1});});
    expect(revisions).toEqual([0,1,2,3,4]);expect((await readSession(user_id,id))!.payload.workout.ended_at).toBe("2026-10-19T00:13:00.000Z");
  });
  it("retains unauthorized changes and isolates accounts",async()=>{
    const p=fixture(),{id,user_id}=p.workout;await cacheSession(p);await enqueue(user_id,id,action(p));
    await syncSession(user_id,id,async()=>Response.json({},{status:401}));
    expect((await readSession(user_id,id))!.queue).toHaveLength(1);
    expect(await listSessions(crypto.randomUUID())).toEqual([]);
    expect(await readSession(crypto.randomUUID(),id)).toBeUndefined();
    let calls=0;await syncSession(user_id,id,async()=>{calls++;return Response.json({revision:1});},()=>false);expect(calls).toBe(0);
  });
  it("requires explicit resolution after a conflicting revision",async()=>{
    const p=fixture(),{id,user_id}=p.workout;await cacheSession(p);await enqueue(user_id,id,action(p));
    await syncSession(user_id,id,async()=>Response.json({error:"Changed"},{status:409}));
    expect((await readSession(user_id,id))!.issue?.conflict).toBe(true);
    await resolveConflict(user_id,id,{...p.workout,revision:8},true);
    expect((await readSession(user_id,id))!.queue[0].expectedRevision).toBe(8);
  });
  it("does not overwrite simultaneous local transactions",async()=>{
    const p=fixture(),{id,user_id}=p.workout;await cacheSession(p);
    await Promise.all([enqueue(user_id,id,action(p)),enqueue(user_id,id,action(p))]);
    const r=(await readSession(user_id,id))!;expect(r.queue).toHaveLength(2);expect(r.queue.map(o=>o.expectedRevision)).toEqual([0,1]);
    expect(projectedWorkout(r).workout_exercises[0].set_logs.map(s=>s.set_index)).toEqual([0,1]);
  });
  it("rejects a stale second tap from another view of the same draft",async()=>{
    const p=fixture(),{id,user_id}=p.workout;await cacheSession(p);
    const key=p.allExercises[0].id+":0";
    await enqueue(user_id,id,action(p),key);
    await expect(enqueue(user_id,id,action(p),key)).rejects.toThrow("Esta serie ya se registró");
    expect((await readSession(user_id,id))!.queue).toHaveLength(1);
  });
});
