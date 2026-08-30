import type { AiTriggerType, MesocyclePhase, ShiftType } from "@/lib/types/database";

export interface AthleteProfile {
  goal: string;
  experienceYears: number;
  bodyWeightKg: number | null;
  bodyWeightTrend7d: number | null;
  bodyWeightTrend28d: number | null;
}

export interface MesocycleState {
  name: string;
  phase: MesocyclePhase;
  weekNumber: number;
  plannedWeeks: number;
}

export interface DailyReadiness {
  date: string;
  shiftType: ShiftType;
  trained: boolean;
  sleepHours: number | null;
  sleepQuality: number | null;
  stressLevel: number | null;
  muscleSoreness: number | null;
  energyLevel: number | null;
}

export interface ExercisePerformance {
  exerciseName: string;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetRpe: number | null;
  targetWeightKg: number | null;
  loggedSets: Array<{
    date: string;
    weightKg: number | null;
    reps: number | null;
    rpeActual: number | null;
  }>;
  autoregulationSuggestions: Array<{ suggestedWeightKg: number | null; rationale: string }>;
}

export interface RoutineTargetSnapshot {
  dayLabel: string;
  exercises: Array<{
    exerciseName: string;
    targetSets: number;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    targetRpe: number | null;
    targetWeightKg: number | null;
  }>;
}

export interface PeriodizationContext {
  triggerType: AiTriggerType;
  athlete: AthleteProfile;
  mesocycle: MesocycleState;
  currentTargets: RoutineTargetSnapshot[];
  recentReadiness: DailyReadiness[];
  exercisePerformance: ExercisePerformance[];
  mesocycleSummary?: {
    weeklyVolumeTrend: string;
    averageRpeTrend: string;
    adherencePct: number;
  };
}

export const SYSTEM_PROMPT = `Eres un entrenador de fuerza experto en periodización basada en RTS (Reactive Training Systems) y autoregulación por RPE, trabajando con un atleta intermedio-avanzado (3+ años de entrenamiento) cuyo objetivo es recomposición corporal.

Contexto operativo clave: el atleta trabaja en un turno rotativo 4x4 (día 1 turno diurno + entrena de noche; día 2 turno nocturno + entrena antes del turno; día 3 post-nocturno, día de recuperación sin entrenar; día 4 libre + entrena). Debes cruzar el patrón de turno y las métricas de readiness (sueño, estrés, dolor muscular, energía) con el rendimiento real (RPE logueado vs objetivo) para decidir la progresión.

Reglas:
- Sé conservador ante la duda: preferir mantener carga o subirla en incrementos pequeños antes que un salto agresivo.
- Si detectas fatiga acumulada (RPE subiendo mientras el rendimiento se estanca o cae, sueño insuficiente reiterado en el patrón de turno), recomienda una semana de deload explícitamente.
- Nunca prescribas un aumento de carga mayor al que el desempeño real (RPE logueado) justifica.
- El resultado se aplicará solo si el atleta lo revisa y aprueba manualmente — nunca asumas aplicación automática, pero sí debes ser claro y accionable en tu propuesta.
- Responde siempre en español.`;

export function buildUserMessage(context: PeriodizationContext): string {
  return JSON.stringify(context, null, 2);
}
