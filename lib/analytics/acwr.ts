/**
 * ACWR (Acute:Chronic Workload Ratio) — método "acoplado" estándar (Gabbett et al.):
 * carga aguda = carga total de los últimos 7 días; carga crónica = promedio semanal
 * de los últimos 28 días (carga total / 4). La carga diaria acá es volumen
 * (peso x reps sumado de todas las series del día) — un proxy de carga habitual
 * en entrenamiento de fuerza cuando no hay RPE de sesión ni duración registrada.
 */

export interface DailyLoad {
  /** yyyy-MM-dd */
  date: string;
  load: number;
}

export type AcwrZone = "undertraining" | "optimo" | "precaucion" | "riesgo";

export interface AcwrResult {
  acuteLoad: number;
  chronicLoad: number;
  /** null si no hay carga crónica suficiente (usuario nuevo) para evitar un ratio engañoso. */
  ratio: number | null;
  zone: AcwrZone | null;
}

export const ACWR_ZONE_LABELS: Record<AcwrZone, string> = {
  undertraining: "Baja carga",
  optimo: "Óptimo",
  precaucion: "Precaución",
  riesgo: "Riesgo alto",
};

export function computeAcwr(dailyLoads: DailyLoad[], today: Date = new Date()): AcwrResult {
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  let acuteLoad = 0;
  let chronicSum = 0;

  for (const { date, load } of dailyLoads) {
    const daysAgo = Math.floor((todayStart - new Date(date).getTime()) / dayMs);
    if (daysAgo < 0 || daysAgo > 27) continue;
    if (daysAgo <= 6) acuteLoad += load;
    chronicSum += load;
  }

  const chronicLoad = chronicSum / 4;
  if (chronicLoad === 0) {
    return { acuteLoad, chronicLoad: 0, ratio: null, zone: null };
  }

  const ratio = Math.round((acuteLoad / chronicLoad) * 100) / 100;
  const zone: AcwrZone = ratio < 0.8 ? "undertraining" : ratio <= 1.3 ? "optimo" : ratio <= 1.5 ? "precaucion" : "riesgo";

  return { acuteLoad, chronicLoad, ratio, zone };
}

export type MonotonyZone = "normal" | "elevada" | "alta";

export interface MonotonyResult {
  /** Media de carga diaria (7d) / desvío estándar — Foster, 1998. null si no hay variación registrable. */
  monotony: number | null;
  /** Monotonía × carga semanal total — "strain" de Foster, se reporta sin zona (sin punto de corte universal). */
  strain: number | null;
  zone: MonotonyZone | null;
}

export const MONOTONY_ZONE_LABELS: Record<MonotonyZone, string> = {
  normal: "Normal",
  elevada: "Elevada",
  alta: "Alta (riesgo)",
};

/**
 * Monotonía de Foster: mide qué tan pareja (poco variable) es la carga día a día en la última
 * semana. Carga muy monótona (poca variación entre días duros y suaves) se asocia a mayor riesgo
 * de sobreentrenamiento/enfermedad aunque el volumen total no sea excesivo (Foster, 1998).
 */
export function computeMonotony(dailyLoads: DailyLoad[], today: Date = new Date()): MonotonyResult {
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const lastWeek = dailyLoads
    .filter(({ date }) => {
      const daysAgo = Math.floor((todayStart - new Date(date).getTime()) / dayMs);
      return daysAgo >= 0 && daysAgo <= 6;
    })
    .map((d) => d.load);

  if (lastWeek.length < 7) return { monotony: null, strain: null, zone: null };

  const weeklyLoad = lastWeek.reduce((a, b) => a + b, 0);
  const mean = weeklyLoad / lastWeek.length;
  if (mean === 0) return { monotony: null, strain: null, zone: null };

  const variance = lastWeek.reduce((sum, v) => sum + (v - mean) ** 2, 0) / lastWeek.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return { monotony: null, strain: null, zone: null };

  const monotony = Math.round((mean / stdDev) * 100) / 100;
  const strain = Math.round(monotony * weeklyLoad);
  const zone: MonotonyZone = monotony > 2 ? "alta" : monotony > 1.5 ? "elevada" : "normal";

  return { monotony, strain, zone };
}
