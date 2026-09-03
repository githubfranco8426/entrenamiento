import { describe, expect, it } from "vitest";
import { computeAcwr } from "./acwr";

const TODAY = new Date("2026-09-28T12:00:00Z");

function dateDaysAgo(daysAgo: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

describe("computeAcwr", () => {
  it("devuelve ratio null cuando no hay carga crónica (usuario nuevo)", () => {
    const result = computeAcwr([], TODAY);
    expect(result.ratio).toBeNull();
    expect(result.zone).toBeNull();
  });

  it("calcula ratio 1.0 cuando la carga es constante en las 4 semanas (zona óptima)", () => {
    const dailyLoads = Array.from({ length: 28 }, (_, i) => ({ date: dateDaysAgo(i), load: 1000 }));
    const result = computeAcwr(dailyLoads, TODAY);

    // acuteLoad = 7 días x 1000 = 7000; chronicLoad = (28 días x 1000) / 4 = 7000
    expect(result.acuteLoad).toBe(7000);
    expect(result.chronicLoad).toBe(7000);
    expect(result.ratio).toBe(1);
    expect(result.zone).toBe("optimo");
  });

  it("marca riesgo alto cuando la carga reciente se dispara respecto al historial", () => {
    const baseline = Array.from({ length: 21 }, (_, i) => ({ date: dateDaysAgo(i + 7), load: 500 }));
    const spike = Array.from({ length: 7 }, (_, i) => ({ date: dateDaysAgo(i), load: 2000 }));
    const result = computeAcwr([...baseline, ...spike], TODAY);

    // acuteLoad = 7 x 2000 = 14000; chronicLoad = (21x500 + 7x2000) / 4 = (10500+14000)/4 = 6125
    expect(result.ratio).toBeCloseTo(14000 / 6125, 2);
    expect(result.zone).toBe("riesgo");
  });

  it("marca baja carga cuando el usuario entrenó mucho menos esta semana", () => {
    const baseline = Array.from({ length: 21 }, (_, i) => ({ date: dateDaysAgo(i + 7), load: 1000 }));
    const dip = Array.from({ length: 7 }, (_, i) => ({ date: dateDaysAgo(i), load: 200 }));
    const result = computeAcwr([...baseline, ...dip], TODAY);

    expect(result.zone).toBe("undertraining");
  });

  it("ignora cargas fuera de la ventana de 28 días", () => {
    const oldLoad = [{ date: dateDaysAgo(40), load: 99999 }];
    const recent = Array.from({ length: 7 }, (_, i) => ({ date: dateDaysAgo(i), load: 100 }));
    const result = computeAcwr([...oldLoad, ...recent], TODAY);

    expect(result.chronicLoad).toBe((7 * 100) / 4);
  });
});
