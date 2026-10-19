import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
const user=crypto.randomUUID(),other=crypto.randomUUID(),exercise=crypto.randomUUID();
let db:PGlite;
beforeAll(async()=>{
  db=new PGlite();
  await db.exec("create schema auth; create table auth.users(id uuid primary key); create role authenticated; create role anon; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;");
  await db.exec(readFileSync("supabase/migrations/0001_initial_schema.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/20261019141631_reliable_workout_sync.sql","utf8"));
  await db.exec("grant usage on schema public,auth to authenticated; grant all on all tables in schema public to authenticated; grant select on auth.users to authenticated;");
  await db.query("insert into auth.users(id) values ($1),($2)",[user,other]);
  await db.query("insert into exercises(id,user_id,name) values($1,$2,'Flexiones')",[exercise,user]);
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
},30000);
afterAll(async()=>{await db?.close();});
async function session(){return (await db.query<{id:string}>("insert into workouts(user_id) values($1) returning id",[user])).rows[0].id;}
async function send(id:string,action:object,revision=0,op=crypto.randomUUID()){
  const result=await db.query<{result:{revision:number;conflict?:boolean}}>("select sync_workout($1,$2::jsonb) result",[id,JSON.stringify({id:op,expectedRevision:revision,action})]);
  return result.rows[0].result;
}
function log(){return {kind:"log",setId:crypto.randomUUID(),exerciseId:exercise,routineExerciseId:null,targetSetId:null,setIndex:0,completedAt:"2026-10-18T23:59:00Z",weightKg:0,reps:12,rpeActual:8};}
describe("PostgreSQL workout protocol",()=>{
  it("resumes an older open session instead of creating another",async()=>{
    const first=await db.query<{result:{workout:{id:string};resumed:boolean}}>("select start_or_resume_workout() result");
    const second=await db.query<{result:{workout:{id:string};resumed:boolean}}>("select start_or_resume_workout() result");
    expect(second.rows[0].result.resumed).toBe(true);
    expect(second.rows[0].result.workout.id).toBe(first.rows[0].result.workout.id);
  });
  it("atomically creates exercise and set, replays exactly once, preserves performed time",async()=>{
    const id=await session(),a=log(),op=crypto.randomUUID();
    expect((await send(id,a,0,op)).revision).toBe(1);
    expect((await send(id,a,0,op)).revision).toBe(1);
    const sets=await db.query<{weight_kg:string;completed_at:Date}>("select weight_kg,completed_at from set_logs where id=$1",[a.setId]);
    expect(sets.rows).toHaveLength(1);expect(Number(sets.rows[0].weight_kg)).toBe(0);
    expect(new Date(sets.rows[0].completed_at).toISOString()).toBe(a.completedAt.replace("Z",".000Z"));
  });
  it("edits, deletes and closes idempotently",async()=>{
    const id=await session(),a=log();await send(id,a);
    await send(id,{kind:"edit",setId:a.setId,weightKg:2,reps:15,rpeActual:7},1);
    const op=crypto.randomUUID();await send(id,{kind:"delete",setId:a.setId},2,op);await send(id,{kind:"delete",setId:a.setId},2,op);
    expect((await db.query("select id from set_logs where id=$1",[a.setId])).rows).toHaveLength(0);
    expect((await send(id,{kind:"finish",durationMinutes:43},3)).revision).toBe(4);
    expect((await send(id,log(),4)).conflict).toBe(true);
    await send(id,{kind:"reopen"},4);
  });
  it("detects concurrent changes and rejects foreign-workout set IDs",async()=>{
    const id=await session(),another=await session(),a=log();await send(id,a);
    expect((await send(id,log(),0)).conflict).toBe(true);
    await expect(send(another,{kind:"edit",setId:a.setId,weightKg:10,reps:5,rpeActual:8})).rejects.toThrow("Serie no encontrada");
  });
  it("never reuses an index after deleting the last set, including on a new device",async()=>{
    const id=await session(),a=log();await send(id,a);
    await send(id,{kind:"delete",setId:a.setId},1);
    await expect(send(id,log(),2)).rejects.toThrow("La serie ya existe");
    expect((await send(id,{...log(),setIndex:1},2)).revision).toBe(3);
    const rows=await db.query<{next_set_index:number}>("select next_set_index from workout_exercises where workout_id=$1",[id]);
    expect(rows.rows[0].next_set_index).toBe(2);
  });
  it("enforces ownership under RLS",async()=>{
    const id=await session();
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
    try {await expect(send(id,log())).rejects.toThrow("Entrenamiento no encontrado");}
    finally {await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);}
  });
  it("rejects invalid input without partial writes",async()=>{
    const id=await session();
    await expect(send(id,{...log(),weightKg:-1})).rejects.toThrow("Valores de serie inválidos");
    expect((await db.query("select id from workout_exercises where workout_id=$1",[id])).rows).toHaveLength(0);
  });
});
