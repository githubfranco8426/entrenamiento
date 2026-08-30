import { z } from "zod";

export const ExerciseTargetSchema = z.object({
  exerciseName: z.string(),
  targetSets: z.number().int().min(1).max(6),
  targetRepRangeMin: z.number().int().min(1),
  targetRepRangeMax: z.number().int().min(1),
  targetRpe: z.number().min(5).max(10),
  targetWeightKg: z.number().nullable(),
  notes: z.string().nullable(),
});

export const RoutineTargetSchema = z.object({
  dayLabel: z.string(),
  exercises: z.array(ExerciseTargetSchema),
});

export const PeriodizationDecisionSchema = z.object({
  summary: z.string(),
  phaseTransition: z.object({
    shouldTransition: z.boolean(),
    fromPhase: z.enum(["acumulacion", "intensificacion", "deload", "realizacion"]),
    toPhase: z.enum(["acumulacion", "intensificacion", "deload", "realizacion"]).nullable(),
    isDeloadWeek: z.boolean(),
    justification: z.string(),
  }),
  nextMicrocycleTargets: z.array(RoutineTargetSchema),
  warnings: z.array(
    z.object({
      severity: z.enum(["info", "atencion", "alerta"]),
      message: z.string(),
    }),
  ),
  shiftAdjustmentNotes: z.string().nullable(),
});

export type PeriodizationDecision = z.infer<typeof PeriodizationDecisionSchema>;
export type RoutineTarget = z.infer<typeof RoutineTargetSchema>;
export type ExerciseTarget = z.infer<typeof ExerciseTargetSchema>;
