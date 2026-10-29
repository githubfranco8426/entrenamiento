import { z } from "zod";

const values = { weightKg: z.number().finite().min(0).max(9999), reps: z.number().int().min(1).max(10000), rpeActual: z.number().min(5).max(10) };
export const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("log"), setId: z.uuid(), exerciseId: z.uuid(), routineExerciseId: z.uuid().nullable(), targetSetId: z.uuid().nullable(), setIndex: z.number().int().min(0), completedAt: z.iso.datetime(), ...values }),
  z.object({ kind: z.literal("edit"), setId: z.uuid(), ...values }),
  z.object({ kind: z.literal("delete"), setId: z.uuid() }),
  z.object({ kind: z.literal("finish"), durationMinutes: z.number().int().min(1).max(720) }),
  z.object({ kind: z.literal("reopen") }),
]);
export const operationSchema = z.object({ id: z.uuid(), expectedRevision: z.number().int().min(0), action: actionSchema });
export type WorkoutAction = z.infer<typeof actionSchema>;
export type Operation = z.infer<typeof operationSchema>;
export interface ExerciseOption { id: string; name: string; plate_increment_kg: number; thumbnail_url: string | null; video_url: string | null; cues?: string[] | null; biomechanics_notes?: string | null }
export interface TargetSet { id: string; set_index: number; set_type: string; target_reps_min: number | null; target_reps_max: number | null; target_rpe: number | null; target_weight_kg: number | null; rest_seconds: number | null }
export interface SetLog { id: string; set_index: number; target_set_id?: string | null; weight_kg: number | null; reps: number | null; rpe_actual: number | null; completed_at?: string }
export interface RoutineExercise { id: string; exercise_id: string; order_index: number; notes: string | null; exercises: ExerciseOption | null; target_sets: TargetSet[] }
export interface WorkoutExercise { id: string; exercise_id: string; routine_exercise_id: string | null; next_set_index?: number; exercises: ExerciseOption | null; set_logs: SetLog[] }
export interface WorkoutData {
  id: string; user_id: string; revision: number; started_at: string; ended_at: string | null;
  routines: { title: string; day_label: string | null; routine_exercises: RoutineExercise[] } | null;
  workout_exercises: WorkoutExercise[];
}
export interface SessionPayload {
  workout: WorkoutData; allExercises: ExerciseOption[];
  estimatedOneRepMaxByExercise: Record<string, number>;
  acwr: { ratio: number; zone: import("@/lib/analytics/acwr").AcwrZone | null } | null;
  nextRoutineLabel: string | null;
  programLabel?: string | null;
}
export interface SessionRecord {
  userId: string; workoutId: string; payload: SessionPayload; queue: Operation[];
  drafts: Record<string, { weight: string; reps: string; rir: string }>;
  extraExerciseIds: string[]; nextIndexes: Record<string, number>;
  issue?: { message: string; conflict: boolean }; updatedAt: number;
}
export function blockIdentity(exerciseId: string, routineExerciseId: string | null) { return routineExerciseId ?? exerciseId; }
export function applyAction(workout: WorkoutData, action: WorkoutAction, exercises: ExerciseOption[]): WorkoutData {
  const next = structuredClone(workout);
  if (action.kind === "finish") next.ended_at = new Date(Date.parse(next.started_at) + action.durationMinutes * 60000).toISOString();
  else if (action.kind === "reopen") next.ended_at = null;
  else if (action.kind === "log") {
    let block = next.workout_exercises.find(w => blockIdentity(w.exercise_id, w.routine_exercise_id) === blockIdentity(action.exerciseId, action.routineExerciseId));
    if (!block) {
      block = { id: action.routineExerciseId ?? action.exerciseId, exercise_id: action.exerciseId, routine_exercise_id: action.routineExerciseId, exercises: exercises.find(e => e.id === action.exerciseId) ?? null, set_logs: [] };
      next.workout_exercises.push(block);
    }
    if (!block.set_logs.some(s => s.id === action.setId)) block.set_logs.push({ id: action.setId, set_index: action.setIndex, target_set_id: action.targetSetId, weight_kg: action.weightKg, reps: action.reps, rpe_actual: action.rpeActual, completed_at: action.completedAt });
    block.next_set_index = Math.max(block.next_set_index ?? 0, action.setIndex + 1);
  } else {
    for (const block of next.workout_exercises) {
      if (action.kind === "delete") block.set_logs = block.set_logs.filter(s => s.id !== action.setId);
      else block.set_logs = block.set_logs.map(s => s.id === action.setId ? { ...s, weight_kg: action.weightKg, reps: action.reps, rpe_actual: action.rpeActual } : s);
    }
  }
  return next;
}
export function projectedWorkout(record: SessionRecord) {
  return record.queue.reduce((w, op) => applyAction(w, op.action, record.payload.allExercises), record.payload.workout);
}
export function nextSetIndex(record: SessionRecord, exerciseId: string, routineExerciseId: string | null): number {
  const key = blockIdentity(exerciseId, routineExerciseId);
  const blocks = projectedWorkout(record).workout_exercises.filter(w => blockIdentity(w.exercise_id, w.routine_exercise_id) === key);
  return Math.max(record.nextIndexes[key] ?? 0, ...blocks.map(w => w.next_set_index ?? 0), ...blocks.flatMap(w => w.set_logs).map(s => s.set_index + 1));
}
