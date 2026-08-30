/**
 * Conversión RPE <-> %1RM basada en "reps en reserva" (RIR), el mismo principio
 * detrás de la tabla RPE de Mike Tuchscherer / RTS: RPE 10 = fallo (0 RIR),
 * cada punto de RPE por debajo representa ~1 repetición en reserva.
 *
 * En vez de hardcodear una tabla de porcentajes (fácil de transcribir mal de memoria),
 * se deriva la relación reps-a-fallo -> %1RM con la fórmula de Epley, que es monótona
 * y estable en todo el rango de reps que se usa en esta app (1-20).
 */

export function repsInReserve(rpe: number): number {
  return 10 - rpe;
}

export function repsToFailure(reps: number, rpe: number): number {
  return reps + repsInReserve(rpe);
}

/** %1RM (0-100) que representa levantar `reps` reps a un RPE dado. */
export function percentOneRepMax(reps: number, rpe: number): number {
  const rtf = repsToFailure(reps, rpe);
  return (1 / (1 + rtf / 30)) * 100;
}

export function estimateOneRepMax(weightKg: number, reps: number, rpe: number): number {
  const pct = percentOneRepMax(reps, rpe);
  return weightKg / (pct / 100);
}

/** Peso necesario para levantar `targetReps` a `targetRpe`, dado un 1RM estimado. */
export function weightForTarget(oneRepMaxKg: number, targetReps: number, targetRpe: number): number {
  const pct = percentOneRepMax(targetReps, targetRpe);
  return oneRepMaxKg * (pct / 100);
}
