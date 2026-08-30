import { describe, expect, it } from "vitest";
import { suggestNextLoad } from "./engine";

describe("suggestNextLoad", () => {
  it("mantiene el mismo peso cuando el RPE real es igual al objetivo", () => {
    const result = suggestNextLoad({
      targetReps: 8,
      targetRpe: 8,
      actualWeightKg: 80,
      actualReps: 8,
      actualRpe: 8,
      plateIncrementKg: 2.5,
    });

    expect(result.suggestedWeightKg).toBeCloseTo(80, 0);
  });

  it("baja el peso cuando el RPE real está por encima del objetivo (mismas reps)", () => {
    const result = suggestNextLoad({
      targetReps: 8,
      targetRpe: 8,
      actualWeightKg: 80,
      actualReps: 8,
      actualRpe: 9.5,
      plateIncrementKg: 2.5,
    });

    expect(result.suggestedWeightKg).toBeLessThan(80);
  });

  it("sube el peso cuando el RPE real está por debajo del objetivo (mismas reps)", () => {
    const result = suggestNextLoad({
      targetReps: 8,
      targetRpe: 8,
      actualWeightKg: 80,
      actualReps: 8,
      actualRpe: 7,
      plateIncrementKg: 2.5,
    });

    expect(result.suggestedWeightKg).toBeGreaterThan(80);
  });

  it("usa las reps reales (no el target) para estimar el 1RM", () => {
    const conMenosReps = suggestNextLoad({
      targetReps: 8,
      targetRpe: 8,
      actualWeightKg: 80,
      actualReps: 5,
      actualRpe: 8,
      plateIncrementKg: 2.5,
    });
    const conMasReps = suggestNextLoad({
      targetReps: 8,
      targetRpe: 8,
      actualWeightKg: 80,
      actualReps: 10,
      actualRpe: 8,
      plateIncrementKg: 2.5,
    });

    // Al mismo peso y RPE, más reps reales implica un 1RM estimado mayor.
    expect(conMasReps.estimated1RM).toBeGreaterThan(conMenosReps.estimated1RM);
  });

  it("respeta el cap de seguridad del 10% ante un fallo de serie severo", () => {
    const result = suggestNextLoad({
      targetReps: 8,
      targetRpe: 8,
      actualWeightKg: 80,
      actualReps: 3, // falló muy por debajo del target
      actualRpe: 10,
      plateIncrementKg: 2.5,
    });

    const floor = 80 * 0.9;
    expect(result.suggestedWeightKg).toBeGreaterThanOrEqual(floor - 2.5);
    expect(result.rationale).toMatch(/limitado al 10%/);
  });

  it("respeta distintos incrementos de disco al redondear", () => {
    const conMancuerna = suggestNextLoad({
      targetReps: 8,
      targetRpe: 8,
      actualWeightKg: 20,
      actualReps: 8,
      actualRpe: 7,
      plateIncrementKg: 4, // saltos de mancuerna típicos
    });

    expect(conMancuerna.suggestedWeightKg % 4).toBeCloseTo(0, 5);
  });
});
