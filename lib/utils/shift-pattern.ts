import { differenceInCalendarDays } from "date-fns";
import type { ShiftType } from "@/lib/types/database";

/**
 * Ciclo de turno rotativo 4x4 de Franco:
 * día 1 diurno + entrena de noche · día 2 nocturno + entrena antes del turno ·
 * día 3 post-nocturno, sin entrenar (recuperación) · día 4 libre + entrena.
 */
const SHIFT_CYCLE: readonly ShiftType[] = [
  "dia1_diurno",
  "dia2_nocturno",
  "dia3_post_nocturno_descanso",
  "dia4_libre",
];

/** `anchorDate` debe ser una fecha en la que el día del ciclo fue "dia1_diurno" (configurado en /ajustes). */
export function shiftTypeForDate(date: Date, anchorDate: Date): ShiftType {
  const diff = differenceInCalendarDays(date, anchorDate);
  const index = ((diff % SHIFT_CYCLE.length) + SHIFT_CYCLE.length) % SHIFT_CYCLE.length;
  return SHIFT_CYCLE[index];
}

export function willTrainByDefault(shiftType: ShiftType): boolean {
  return shiftType !== "dia3_post_nocturno_descanso";
}

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  dia1_diurno: "Día 1 — Turno diurno (entrena de noche)",
  dia2_nocturno: "Día 2 — Turno nocturno (entrena antes del turno)",
  dia3_post_nocturno_descanso: "Día 3 — Post-nocturno (descanso)",
  dia4_libre: "Día 4 — Libre (entrena)",
};
