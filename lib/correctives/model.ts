import { z } from "zod";

export const patterns = [
  "Empuje",
  "Tracción",
  "Dominante rodilla",
  "Cadena posterior",
] as const;
export const library = [
  {
    id: "press-mancuernas",
    name: "Press con mancuernas",
    pattern: "Empuje",
    place: "Gimnasio",
  },
  {
    id: "flexion-pared",
    name: "Flexión en pared",
    pattern: "Empuje",
    place: "Casa",
  },
  {
    id: "remo-polea",
    name: "Remo en polea",
    pattern: "Tracción",
    place: "Gimnasio",
  },
  {
    id: "remo-banda",
    name: "Remo con banda",
    pattern: "Tracción",
    place: "Casa",
  },
  {
    id: "sentadilla-goblet",
    name: "Sentadilla goblet",
    pattern: "Dominante rodilla",
    place: "Gimnasio",
  },
  {
    id: "sentarse-levantarse",
    name: "Sentarse y levantarse",
    pattern: "Dominante rodilla",
    place: "Casa",
  },
  {
    id: "peso-muerto",
    name: "Peso muerto rumano",
    pattern: "Cadena posterior",
    place: "Gimnasio",
  },
  {
    id: "puente",
    name: "Puente de cadera",
    pattern: "Cadena posterior",
    place: "Casa",
  },
] as const;
const number = (min: number, max: number) =>
  z.number().finite().min(min).max(max);
export const exerciseSchema = z
  .object({
    exercise: z.enum(library.map((e) => e.id)),
    sets: number(1, 10).int(),
    repsMin: number(1, 100).int(),
    repsMax: number(1, 100).int(),
    rir: number(0, 10).int(),
    rest: number(0, 1800).int(),
    tempo: z.string().regex(/^\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}$/),
  })
  .refine(
    (p) => p.repsMax >= p.repsMin,
    "El máximo debe ser mayor o igual al mínimo.",
  );
export const planSchema = z
  .array(exerciseSchema)
  .min(1)
  .max(20)
  .refine(
    (p) => new Set(p.map((e) => e.exercise)).size === p.length,
    "No repitas ejercicios.",
  );
export type Prescription = z.infer<typeof exerciseSchema>;
export const baselineSchema = z.object({
  day: z.iso.date(),
  fatigue: number(0, 10).int(),
  sleep_hours: number(0, 24),
  sleep_efficiency: number(0, 100).nullable(),
  pain_segment: z.string().trim().min(1).max(80),
  pain: number(0, 10).int(),
  respiratory: z.enum(["Sin síntomas", "Tos", "Disnea", "Otros"]),
  shift: z.enum([
    "Sin turno",
    "Antes de turno",
    "Después de turno",
    "Turno nocturno",
  ]),
  notes: z.string().max(1000),
});
export type Baseline = z.infer<typeof baselineSchema> & {
  id: string;
  user_id: string;
};
export const setSchema = z
  .object({
    id: z.uuid(),
    session_id: z.uuid(),
    exercise: z.enum(library.map((e) => e.id)),
    ordinal: number(1, 10).int(),
    load_type: z.enum(["kg", "banda", "corporal"]),
    load: number(0, 1000).nullable(),
    equipment: z.string().trim().min(1).max(100),
    reps: number(1, 100).int(),
    rir: number(0, 10).int(),
    quality: z.enum(["Fluida", "Compensación", "Interrumpida"]).nullable(),
  })
  .superRefine((s, ctx) => {
    if (s.load_type === "kg" ? s.load === null : s.load !== null)
      ctx.addIssue({
        code: "custom",
        message: "Registra kg solo para cargas en kg.",
      });
  });
export type LoggedSet = z.infer<typeof setSchema> & {
  created_at: string;
  rest_until: string;
  user_id: string;
};
export type Session = {
  id: string;
  user_id: string;
  baseline_id: string;
  baseline_snapshot: Baseline;
  plan: Prescription[];
  status: "active" | "completed";
  started_at: string;
  ended_at: string | null;
};
export type Workspace = {
  baseline: Baseline | null;
  plan: Prescription[];
  sessions: Session[];
  sets: LoggedSet[];
  baselines: Baseline[];
  userId: string;
};
export const mutationSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("baseline"), data: baselineSchema }),
  z.object({ op: z.literal("plan"), data: planSchema }),
  z.object({ op: z.literal("start"), id: z.uuid(), baselineId: z.uuid() }),
  z.object({ op: z.literal("set"), data: setSchema }),
  z.object({ op: z.literal("finish"), id: z.uuid() }),
]);
export { localDateKey as localDay } from "@/lib/utils/local-date";
export function remainingSeconds(until: string, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(until) - now) / 1000));
}
// Never add bands, bodyweight, different equipment or exercise variants to kg-volume.
export function progression(sessions: Session[], sets: LoggedSet[]) {
  const completed = new Map(
    sessions.filter((s) => s.status === "completed").map((s) => [s.id, s]),
  );
  const groups = new Map<
    string,
    {
      session: Session;
      exercise: string;
      equipment: string;
      load: number;
      loadMin: number;
      loadMax: number;
      reps: number;
      volume: number;
      sets: number;
      target: boolean;
    }
  >();
  for (const s of sets) {
    const session = completed.get(s.session_id);
    if (!session || s.load_type !== "kg" || s.load === null) continue;
    const key = JSON.stringify([s.session_id, s.exercise, s.equipment]);
    const p = session.plan.find((p) => p.exercise === s.exercise);
    const group = groups.get(key) ?? {
      session,
      exercise: s.exercise,
      equipment: s.equipment,
      load: s.load,
      loadMin: s.load,
      loadMax: s.load,
      reps: 0,
      volume: 0,
      sets: 0,
      target: true,
    };
    group.target &&=
      !!p &&
      s.reps >= p.repsMax &&
      s.rir >= p.rir &&
      group.load === s.load &&
      s.quality !== "Interrumpida";
    group.reps += s.reps;
    group.loadMin = Math.min(group.loadMin, s.load);
    group.loadMax = Math.max(group.loadMax, s.load);
    group.volume += s.load * s.reps;
    group.sets++;
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      target:
        g.target &&
        g.sets === g.session.plan.find((p) => p.exercise === g.exercise)?.sets,
    }))
    .sort((a, b) => a.session.started_at.localeCompare(b.session.started_at));
}
