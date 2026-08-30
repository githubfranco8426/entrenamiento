import { describe, expect, it } from "vitest";
import { shiftTypeForDate, willTrainByDefault } from "./shift-pattern";

describe("shiftTypeForDate", () => {
  const anchor = new Date("2026-03-01T00:00:00");

  it("devuelve dia1_diurno en la fecha ancla", () => {
    expect(shiftTypeForDate(anchor, anchor)).toBe("dia1_diurno");
  });

  it("avanza correctamente por el ciclo de 4 días", () => {
    expect(shiftTypeForDate(new Date("2026-03-02T00:00:00"), anchor)).toBe("dia2_nocturno");
    expect(shiftTypeForDate(new Date("2026-03-03T00:00:00"), anchor)).toBe("dia3_post_nocturno_descanso");
    expect(shiftTypeForDate(new Date("2026-03-04T00:00:00"), anchor)).toBe("dia4_libre");
    expect(shiftTypeForDate(new Date("2026-03-05T00:00:00"), anchor)).toBe("dia1_diurno");
  });

  it("funciona correctamente con fechas anteriores a la ancla", () => {
    expect(shiftTypeForDate(new Date("2026-02-28T00:00:00"), anchor)).toBe("dia4_libre");
  });
});

describe("willTrainByDefault", () => {
  it("es false solo en el día de descanso post-nocturno", () => {
    expect(willTrainByDefault("dia3_post_nocturno_descanso")).toBe(false);
    expect(willTrainByDefault("dia1_diurno")).toBe(true);
    expect(willTrainByDefault("dia2_nocturno")).toBe(true);
    expect(willTrainByDefault("dia4_libre")).toBe(true);
  });
});
