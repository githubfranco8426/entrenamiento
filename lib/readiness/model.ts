import { z } from "zod";
import type { ShiftType } from "@/lib/types/database";

export type ClinicalCheckin = {
  user_id: string;
  log_date: string;
  fatigue_perceived: number | null;
  sleep_efficiency: number | null;
  pain_segment: string | null;
  pain_nrs: number | null;
  respiratory: string | null;
};
export type ReadinessLogData = {
  log_date: string;
  shift_type: ShiftType;
  will_train: boolean;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  muscle_soreness: number | null;
  energy_level: number | null;
  notes: string | null;
};
const optionalNumber = (min: number, max: number) =>
  z.number().finite().min(min).max(max).nullable().optional();
const rating = z.number().int().min(1).max(5).nullable().optional();
export const checkinSchema = z
  .object({
    logDate: z.iso.date(),
    shiftType: z.enum([
      "dia1_diurno",
      "dia2_nocturno",
      "dia3_post_nocturno_descanso",
      "dia4_libre",
    ]),
    willTrain: z.boolean(),
    sleepHours: optionalNumber(0, 24),
    sleepQuality: rating,
    stressLevel: rating,
    muscleSoreness: rating,
    energyLevel: rating,
    notes: z.string().max(4000).nullable().optional(),
    fatiguePerceived: z.number().int().min(0).max(10).nullable().optional(),
    sleepEfficiency: optionalNumber(0, 100),
    painSegment: z.string().trim().max(80).nullable().optional(),
    painNrs: z.number().int().min(0).max(10).nullable().optional(),
    respiratory: z
      .enum(["Sin síntomas", "Tos", "Disnea", "Otros"])
      .nullable()
      .optional(),
  })
  .refine(
    (p) => p.painNrs == null || p.painNrs === 0 || !!p.painSegment,
    "Indica la zona del dolor.",
  );

// Omitted fields stay omitted: a quick energy update must not erase the full check-in.
export function checkinPayload(input: z.infer<typeof checkinSchema>) {
  const core: Record<string, string | number | boolean | null> = {
    log_date: input.logDate,
    shift_type: input.shiftType,
    will_train: input.willTrain,
  };
  const clinical: Record<string, string | number | null> = {};
  for (const [from, to] of Object.entries({
    sleepHours: "sleep_hours",
    sleepQuality: "sleep_quality",
    stressLevel: "stress_level",
    muscleSoreness: "muscle_soreness",
    energyLevel: "energy_level",
    notes: "notes",
  }) as [keyof typeof input, string][]) {
    if (input[from] !== undefined)
      core[to] = input[from] as string | number | boolean | null;
  }
  for (const [from, to] of Object.entries({
    fatiguePerceived: "fatigue_perceived",
    sleepEfficiency: "sleep_efficiency",
    painSegment: "pain_segment",
    painNrs: "pain_nrs",
    respiratory: "respiratory",
  }) as [keyof typeof input, string][]) {
    if (input[from] !== undefined)
      clinical[to] = input[from] as string | number | null;
  }
  return { ...core, ...(Object.keys(clinical).length ? { clinical } : {}) };
}
