import type { ShiftType } from "@/lib/types/database";

export const SHIFT_SHORT_LABELS: Record<ShiftType, string> = {
  dia1_diurno: "D1",
  dia2_nocturno: "D2",
  dia3_post_nocturno_descanso: "D3",
  dia4_libre: "L",
};

export const SHIFT_DOT_CLASSES: Record<ShiftType, string> = {
  dia1_diurno: "bg-chart-1",
  dia2_nocturno: "bg-chart-2",
  dia3_post_nocturno_descanso: "bg-muted-foreground/40",
  dia4_libre: "bg-chart-3",
};
