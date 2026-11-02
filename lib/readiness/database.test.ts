import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { checkinPayload, checkinSchema } from "./model";
import { lumbarRoutine, lumbarGuides } from "@/lib/correctives/routine";
import { planSchema } from "@/lib/correctives/model";
let db:PGlite;
const owner=crypto.randomUUID(),other=crypto.randomUUID();
const core={log_date:"2035-01-01",shift_type:"dia4_libre",will_train:true};
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create schema auth; create table auth.users(id uuid primary key); create role authenticated; create role anon; create role service_role bypassrls;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to authenticated,anon; alter default privileges in schema public grant all on tables to authenticated;`);
 await db.exec(readFileSync("supabase/migrations/0001_initial_schema.sql","utf8"));
 await db.exec(readFileSync("supabase/migrations/20261102162803_corrective_exercises.sql","utf8"));
 await db.query("insert into auth.users values($1),($2)",[owner,other]);
 await db.query("insert into corrective_baselines(user_id,day,fatigue,sleep_hours,pain_segment,pain,respiratory,shift) values($1,'2026-10-30',4,7,'Lumbar',2,'Sin síntomas','Sin turno')",[owner]);
 await db.exec(readFileSync("supabase/migrations/20261102175100_unified_daily_checkin.sql","utf8"));
},30000);
afterAll(async()=>{await db?.close();});
async function isolated(fn:()=>Promise<void>){await db.exec("begin");try{await db.exec("set local role authenticated");await db.query("select set_config('request.jwt.claim.sub',$1,true)",[owner]);await fn();}finally{await db.exec("rollback");}}
const save=(p:object)=>db.query("select save_daily_checkin($1)",[p]);
describe("Unified daily check-in",()=>{
 it("preserves legacy clinical evaluations without inventing a readiness or shift",async()=>{
  const c=await db.query<{fatigue_perceived:number}>("select * from readiness_clinical where log_date='2026-10-30'");
  expect(c.rows[0].fatigue_perceived).toBe(4);
  expect((await db.query("select * from readiness_logs where log_date='2026-10-30'")).rows).toHaveLength(0);
 });
 it("saves both parts once and quick energy updates preserve sleep and private symptoms",()=>isolated(async()=>{
  await save({...core,sleep_hours:7,energy_level:2,clinical:{fatigue_perceived:4,sleep_efficiency:85,pain_segment:"Lumbar",pain_nrs:2,respiratory:"Sin síntomas"}});
  await save({...core,energy_level:5});await save({...core,energy_level:5});
  const r=(await db.query<{sleep_hours:string;energy_level:number}>("select * from readiness_logs where log_date=$1",[core.log_date])).rows;
  expect(r).toHaveLength(1);expect(Number(r[0].sleep_hours)).toBe(7);expect(r[0].energy_level).toBe(5);
  const c=(await db.query<{fatigue_perceived:number;pain_nrs:number}>("select * from readiness_clinical where log_date=$1",[core.log_date])).rows;
  expect(c).toHaveLength(1);expect(c[0].fatigue_perceived).toBe(4);expect(c[0].pain_nrs).toBe(2);
 }));
 it("rolls back the core change if clinical validation fails; explicit null clears a field",()=>isolated(async()=>{
  await save({...core,energy_level:2,clinical:{pain_segment:"Lumbar",pain_nrs:2}});
  await db.exec("savepoint invalid");await expect(save({...core,energy_level:5,clinical:{pain_nrs:11}})).rejects.toThrow();await db.exec("rollback to savepoint invalid");
  expect((await db.query<{energy_level:number}>("select energy_level from readiness_logs where log_date=$1",[core.log_date])).rows[0].energy_level).toBe(2);
  await save({...core,clinical:{pain_nrs:null,pain_segment:null}});
  expect((await db.query<{pain_nrs:number|null}>("select pain_nrs from readiness_clinical where log_date=$1",[core.log_date])).rows[0].pain_nrs).toBeNull();
 }));
 it("keeps private fields owner-only and rejects unauthenticated writes",()=>isolated(async()=>{
  await save({...core,clinical:{fatigue_perceived:4}});
  await db.query("select set_config('request.jwt.claim.sub',$1,true)",[other]);
  expect((await db.query("select * from readiness_clinical")).rows).toHaveLength(0);
  await db.exec("savepoint invalid");await expect(db.query("insert into readiness_clinical(user_id,log_date) values($1,'2035-01-02')",[owner])).rejects.toThrow();await db.exec("rollback to savepoint invalid");
  await db.exec("set local role anon; savepoint no_auth");await expect(save(core)).rejects.toThrow();await db.exec("rollback to savepoint no_auth");
 }));
 it("accepts the hiperlordosis routine in the database and provides a guide for each exercise",()=>isolated(async()=>{
  expect(planSchema.safeParse(lumbarRoutine).success).toBe(true);
  expect(lumbarRoutine.every(p=>!!lumbarGuides[p.exercise])).toBe(true);
  await db.query("insert into corrective_plans(user_id,plan) values($1,$2)",[owner,lumbarRoutine]);
 }));
 it("validates optional symptoms and keeps energy distinct from perceived fatigue",()=>{
  const quick=checkinSchema.parse({logDate:"2026-11-02",shiftType:"dia4_libre",willTrain:true,energyLevel:5});
  expect(checkinPayload(quick)).toEqual({log_date:"2026-11-02",shift_type:"dia4_libre",will_train:true,energy_level:5});
  expect(checkinSchema.safeParse({...quick,painNrs:3,painSegment:""}).success).toBe(false);
  expect(checkinSchema.safeParse({...quick,sleepEfficiency:101}).success).toBe(false);
 });
});
