import { z } from "zod";

const id = z.string().min(1).max(120);
const num = z.number().finite();
const date = z.iso.date();
const config = z.object({
  id, sets: num.int().min(1).max(30).default(3),
  reps: num.int().min(0).max(1000).optional(),
  repsMin: num.int().min(0).max(1000).optional(),
  weight: num.min(0).max(5000).optional(),
  mode: z.enum(["reps", "time", "cardio"]).optional(),
  sec: num.min(0).max(86400).optional(), min: num.min(0).max(1440).optional(),
}).passthrough();
export const RoutineSchema = z.object({ id, name: z.string().min(1).max(200), ex: z.array(config).max(100) }).passthrough();
const entry = z.object({
  id, mode: z.enum(["reps", "time", "cardio"]).optional(),
  sets: z.array(z.object({
    done: z.boolean().optional(), w: num.min(0).max(5000).optional(),
    r: num.int().min(0).max(1000).optional(),
    rir: num.min(0).max(10).optional(), rpe: num.min(0).max(10).optional(),
  }).passthrough()).max(200),
}).passthrough();
export const StateSchema = z.object({
  unit: z.enum(["kg", "lb"]).default("kg"), lang: z.string().max(10).default("es"),
  routines: z.array(RoutineSchema).max(200),
  workouts: z.array(z.object({
    id, d: date, start: num.min(0).max(8640000000000000), end: num.min(0).max(8640000000000000).optional(),
    name: z.string().max(200).optional(), routineId: id.nullable().optional(), entries: z.array(entry).max(100),
  }).passthrough()).max(10000),
  bodyweight: z.array(z.object({ id: id.optional(), d: date, w: num.positive().max(2000) }).passthrough()).max(10000),
  customEx: z.array(z.object({ id, n: z.string().min(1).max(200), bp: z.string().max(100).default(""), eq: z.string().max(100).optional() }).passthrough()).max(5000),
  week: z.record(z.string().regex(/^[0-6]$/), id).default({}),
}).passthrough();
export type OpenGymState = z.infer<typeof StateSchema>;
export const EMPTY_STATE = { unit: "kg", lang: "es", routines: [], workouts: [], bodyweight: [], customEx: [], week: {} };

// Ignore editor-only metadata when deciding whether an imported routine was changed.
export function routineSignature(r: z.infer<typeof RoutineSchema>) {
  return JSON.stringify([r.name, r.ex.map(e => [e.id, e.sets, e.reps ?? 0, e.repsMin ?? 0, e.weight ?? 0, e.mode ?? "reps", e.sec ?? 0, e.min ?? 0])]);
}
