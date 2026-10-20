import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll,afterAll,describe,it,expect } from "vitest";
import { EMPTY_STATE, StateSchema } from "./state";
import { publishRecords } from "./bridge";
const user=crypto.randomUUID(),other=crypto.randomUUID();
let db:PGlite;
beforeAll(async()=>{
  db=new PGlite();
  await db.exec("create schema auth; create table auth.users(id uuid primary key); create role authenticated; create role anon; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;");
  await db.exec(readFileSync("supabase/migrations/0001_initial_schema.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/20261020034021_integrate_opengym.sql","utf8"));
  await db.exec("grant usage on schema public,auth to authenticated; grant all on all tables in schema public to authenticated;");
  await db.query("insert into auth.users(id) values ($1),($2)",[user,other]);
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
},30000);
afterAll(async()=>{await db?.close();});
describe("OpenGym PostgreSQL protocol",()=>{
  it("saves atomically and rejects a stale revision",async()=>{
    const first=await db.query<{revision:number}>("select save_opengym_state($1,0) revision",[JSON.stringify(EMPTY_STATE)]);
    expect(first.rows[0].revision).toBe(1);
    await expect(db.query("select save_opengym_state($1,0)",[JSON.stringify(EMPTY_STATE)])).rejects.toThrow("Conflicto");
  });
  it("cannot read or update another user's state",async()=>{
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
    expect((await db.query("select * from opengym_profiles")).rows).toHaveLength(0);
    expect((await db.query("update opengym_profiles set revision=99 where user_id=$1 returning user_id",[user])).rows).toHaveLength(0);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
  });
  it("publishes once, preserves an existing weigh-in, rolls back invalid transfers",async()=>{
    const s=StateSchema.parse({...EMPTY_STATE,customEx:[{id:"x",n:"Press",bp:"chest"}],routines:[{id:"r",name:"Torso",ex:[{id:"x",sets:3,reps:8}]}],bodyweight:[{d:"2026-10-19",w:80}]});
    const records=publishRecords(s,user);
    await db.query("insert into body_metrics(user_id,log_date,weight_kg) values($1,'2026-10-19',75)",[user]);
    await db.query("select publish_opengym($1)",[JSON.stringify(records)]);
    await db.query("select publish_opengym($1)",[JSON.stringify(records)]);
    expect((await db.query("select * from routines")).rows).toHaveLength(1);
    expect((await db.query<{weight_kg:string}>("select weight_kg from body_metrics")).rows[0].weight_kg).toBe("75.00");
    const broken=structuredClone(records); broken.routines[0].id=crypto.randomUUID(); broken.target_sets[0].routine_exercise_id=crypto.randomUUID();
    await expect(db.query("select publish_opengym($1)",[JSON.stringify(broken)])).rejects.toThrow();
    expect((await db.query("select * from routines")).rows).toHaveLength(1);
  });
});
