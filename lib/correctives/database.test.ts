import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  planSchema,
  progression,
  remainingSeconds,
  setSchema,
  type Session,
  type LoggedSet,
} from "./model";

const owner = crypto.randomUUID(),
  other = crypto.randomUUID();
const plan = [
  {
    exercise: "remo-polea",
    sets: 2,
    repsMin: 8,
    repsMax: 12,
    rir: 2,
    rest: 90,
    tempo: "3-0-1-0",
  },
];
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create schema auth; create table auth.users(id uuid primary key); create role authenticated; create role anon; create role service_role bypassrls;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated,anon,service_role;
    alter default privileges in schema public grant all on tables to authenticated,anon,service_role;`);
  await db.exec(
    readFileSync("supabase/migrations/0001_initial_schema.sql", "utf8"),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261102162803_corrective_exercises.sql",
      "utf8",
    ),
  );
  await db.query("insert into auth.users values ($1),($2)", [owner, other]);
}, 30000);
afterAll(async () => {
  await db?.close();
});
async function role(id: string) {
  await db.exec("set local role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
}
async function isolated(fn: () => Promise<void>) {
  await db.exec("begin");
  try {
    await fn();
  } finally {
    await db.exec("rollback");
  }
}
async function fails(sql: string, params: unknown[] = []) {
  await db.exec("savepoint expected_failure");
  try {
    await expect(db.query(sql, params)).rejects.toThrow();
  } finally {
    await db.exec("rollback to savepoint expected_failure");
  }
}
async function setup() {
  await role(owner);
  const b = (
    await db.query<{ id: string }>(
      "insert into corrective_baselines(user_id,day,fatigue,sleep_hours,pain_segment,pain,respiratory,shift) values($1,(now() at time zone 'America/Santiago')::date,4,7,'Hombro',2,'Sin síntomas','Sin turno') returning id",
      [owner],
    )
  ).rows[0].id;
  await db.query("insert into corrective_plans(user_id,plan) values($1,$2)", [
    owner,
    plan,
  ]);
  const id = crypto.randomUUID();
  await db.query("select corrective_start($1,$2)", [id, b]);
  return { id, b };
}
const payload = (id: string, extra = {}) => ({
  id: crypto.randomUUID(),
  session_id: id,
  exercise: "remo-polea",
  ordinal: 1,
  load_type: "kg",
  load: 20,
  equipment: "Polea A",
  reps: 12,
  rir: 2,
  quality: null,
  ...extra,
});

describe("Corrective exercise persistence", () => {
  it("uses existing authenticated accounts while isolating all corrective records and rejecting anonymous access", () =>
    isolated(async () => {
      const { id, b } = await setup();
      const p = payload(id);
      await db.query("select corrective_log_set($1)", [p]);
      await role(other);
      for (const table of [
        "corrective_baselines",
        "corrective_plans",
        "corrective_sessions",
        "corrective_sets",
      ])
        expect((await db.query(`select * from ${table}`)).rows).toHaveLength(0);
      await fails("select corrective_log_set($1)", [p]);
      await fails(
        "insert into corrective_sessions(id,user_id,baseline_id,baseline_snapshot,plan) values($1,$2,$3,'{}',$4)",
        [crypto.randomUUID(), other, b, plan],
      );
      await db.query(
        "insert into corrective_plans(user_id,plan) values($1,$2)",
        [other, plan],
      );
      await db.exec("set local role anon");
      await fails("select * from corrective_sets");
      await fails("select corrective_start($1,$2)", [id, b]);
    }));
  it("recovers one active corrective session and preserves its plan and baseline snapshots", () =>
    isolated(async () => {
      const { id, b } = await setup();
      const resumed = (
        await db.query<{ id: string }>("select (corrective_start($1,$2)).*", [
          crypto.randomUUID(),
          b,
        ])
      ).rows[0];
      expect(resumed.id).toBe(id);
      await db.query("update corrective_baselines set fatigue=9 where id=$1", [
        b,
      ]);
      await db.query("update corrective_plans set plan=$1", [
        [{ ...plan[0], rest: 120 }],
      ]);
      const s = (
        await db.query<{
          plan: typeof plan;
          baseline_snapshot: { fatigue: number };
        }>("select * from corrective_sessions where id=$1", [id])
      ).rows[0];
      expect(s.plan[0].rest).toBe(90);
      expect(s.baseline_snapshot.fatigue).toBe(4);
      await fails("update corrective_sessions set plan=$1", [plan]);
    }));
  it("replays lost-response retries once and rejects changed contents or duplicate ordinals", () =>
    isolated(async () => {
      const { id } = await setup(),
        p = payload(id);
      const saved = (
        await db.query<{ id: string; created_at: Date; rest_until: Date }>(
          "select (corrective_log_set($1)).*",
          [p],
        )
      ).rows[0];
      const replay = (
        await db.query<{ id: string; rest_until: Date }>(
          "select (corrective_log_set($1)).*",
          [p],
        )
      ).rows[0];
      expect(replay.id).toBe(saved.id);
      expect(replay.rest_until).toEqual(saved.rest_until);
      expect(
        new Date(saved.rest_until).getTime() -
          new Date(saved.created_at).getTime(),
      ).toBe(90000);
      expect(
        (await db.query("select * from corrective_sets")).rows,
      ).toHaveLength(1);
      await fails("select corrective_log_set($1)", [{ ...p, reps: 10 }]);
      await fails("select corrective_log_set($1)", [
        { ...p, id: crypto.randomUUID() },
      ]);
      await fails("select corrective_log_set($1)", [
        payload(id, { ordinal: 3 }),
      ]);
      await db.query(
        "update corrective_sessions set status='completed',ended_at=now() where id=$1",
        [id],
      );
      expect(
        (
          await db.query<{ id: string }>("select (corrective_log_set($1)).*", [
            p,
          ])
        ).rows[0].id,
      ).toBe(p.id);
      await fails("select corrective_log_set($1)", [
        payload(id, { ordinal: 2 }),
      ]);
    }));
  it("keeps corrective volume out of strength workouts and rejects invalid prescriptions", () =>
    isolated(async () => {
      const { id } = await setup();
      await db.query("select corrective_log_set($1)", [payload(id)]);
      expect((await db.query("select * from workouts")).rows).toHaveLength(0);
      expect((await db.query("select * from set_logs")).rows).toHaveLength(0);
      await fails("update corrective_baselines set fatigue=11");
      await fails("update corrective_baselines set sleep_efficiency=101");
      for (const invalid of [
        [{ ...plan[0], sets: 0 }],
        [{ ...plan[0], rest: null }],
        [...plan, ...plan],
      ])
        await fails("update corrective_plans set plan=$1", [invalid]);
    }));
  it("validates resistance units and recalculates rest from an absolute deadline", () => {
    expect(
      setSchema.safeParse(
        payload(crypto.randomUUID(), { load_type: "banda", load: 20 }),
      ).success,
    ).toBe(false);
    expect(
      setSchema.safeParse(payload(crypto.randomUUID(), { load: NaN })).success,
    ).toBe(false);
    expect(planSchema.safeParse([...plan, ...plan]).success).toBe(false);
    expect(
      remainingSeconds(
        "2026-11-02T12:01:30Z",
        Date.parse("2026-11-02T12:01:00Z"),
      ),
    ).toBe(30);
    expect(
      remainingSeconds(
        "2026-11-02T12:01:30Z",
        Date.parse("2026-11-02T12:10:00Z"),
      ),
    ).toBe(0);
  });
  it("compares exercise and equipment without converting bands/bodyweight to kg", () => {
    const session = {
      id: crypto.randomUUID(),
      status: "completed",
      started_at: "2026-11-02",
      plan,
    } as Session;
    const sets = [
      payload(session.id),
      payload(session.id, { ordinal: 2 }),
      payload(session.id, { load_type: "banda", load: null }),
      payload(session.id, { load_type: "corporal", load: null }),
      payload(session.id, { equipment: "Polea B" }),
    ] as LoggedSet[];
    const result = progression([session], sets);
    expect(result).toHaveLength(2);
    expect(result[0].volume).toBe(480);
    expect(result[0].target).toBe(true);
    expect(result[1].target).toBe(false);
  });
});
