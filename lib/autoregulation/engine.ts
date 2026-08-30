import { estimateOneRepMax, weightForTarget } from "./rpe-tables";

export interface AutoregulationInput {
  targetReps: number;
  targetRpe: number;
  actualWeightKg: number;
  actualReps: number;
  actualRpe: number;
  plateIncrementKg: number;
}

export interface AutoregulationResult {
  estimated1RM: number;
  suggestedWeightKg: number;
  suggestedReps: number;
  rationale: string;
}

/** Nunca sugerir un salto de carga mayor al 10% respecto al peso de la última sesión. */
const MAX_JUMP_RATIO = 0.1;

export function suggestNextLoad(input: AutoregulationInput): AutoregulationResult {
  const { targetReps, targetRpe, actualWeightKg, actualReps, actualRpe, plateIncrementKg } = input;

  const estimated1RM = estimateOneRepMax(actualWeightKg, actualReps, actualRpe);
  const rawSuggestion = weightForTarget(estimated1RM, targetReps, targetRpe);

  const minWeight = actualWeightKg * (1 - MAX_JUMP_RATIO);
  const maxWeight = actualWeightKg * (1 + MAX_JUMP_RATIO);
  const cappedSuggestion = Math.min(Math.max(rawSuggestion, minWeight), maxWeight);
  const wasCapped = cappedSuggestion !== rawSuggestion;

  const suggestedWeightKg = roundToIncrement(cappedSuggestion, plateIncrementKg);

  const rationale = buildRationale({
    actualRpe,
    targetRpe,
    actualWeightKg,
    suggestedWeightKg,
    wasCapped,
  });

  return { estimated1RM, suggestedWeightKg, suggestedReps: targetReps, rationale };
}

function roundToIncrement(value: number, incrementKg: number): number {
  if (!incrementKg || incrementKg <= 0) {
    return Math.round(value * 100) / 100;
  }
  return Math.round(value / incrementKg) * incrementKg;
}

function buildRationale(params: {
  actualRpe: number;
  targetRpe: number;
  actualWeightKg: number;
  suggestedWeightKg: number;
  wasCapped: boolean;
}): string {
  const { actualRpe, targetRpe, actualWeightKg, suggestedWeightKg, wasCapped } = params;
  const delta = suggestedWeightKg - actualWeightKg;
  const capNote = wasCapped ? " (ajuste limitado al 10% máximo por sesión)" : "";

  if (Math.abs(delta) < 0.01) {
    return `RPE real (${actualRpe}) igual al objetivo (${targetRpe}) — se mantiene el mismo peso.`;
  }
  if (delta > 0) {
    return `RPE real (${actualRpe}) por debajo del objetivo (${targetRpe}) — quedó margen, se sugiere subir a ${suggestedWeightKg}kg${capNote}.`;
  }
  return `RPE real (${actualRpe}) por encima del objetivo (${targetRpe}) — se sugiere bajar a ${suggestedWeightKg}kg${capNote}.`;
}
