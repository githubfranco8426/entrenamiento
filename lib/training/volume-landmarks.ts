/**
 * MEV/MAV (series semanales) por grupo muscular, según Analisis_Entrenamiento_2026-08.md
 * (sección 3). `muscle_group` es texto libre cargado por el usuario al crear ejercicios,
 * así que el match es case/acento-insensitive contra varios alias en español e inglés.
 */

export interface VolumeLandmark {
  mev: number;
  mav: number;
}

const LANDMARKS_BY_CANONICAL_NAME: Record<string, VolumeLandmark> = {
  pecho: { mev: 8, mav: 20 },
  cuadriceps: { mev: 8, mav: 18 },
  espalda: { mev: 10, mav: 22 },
  isquiotibiales: { mev: 6, mav: 16 },
  biceps: { mev: 6, mav: 20 },
  hombro: { mev: 6, mav: 22 },
  triceps: { mev: 6, mav: 14 },
  deltoide_posterior: { mev: 6, mav: 16 },
  core: { mev: 8, mav: 20 },
  pantorrillas: { mev: 8, mav: 16 },
};

const ALIAS_TO_CANONICAL: Record<string, string> = {
  pecho: "pecho",
  chest: "pecho",
  cuadriceps: "cuadriceps",
  quads: "cuadriceps",
  quadriceps: "cuadriceps",
  piernas: "cuadriceps",
  espalda: "espalda",
  back: "espalda",
  dorsales: "espalda",
  isquiotibiales: "isquiotibiales",
  hamstrings: "isquiotibiales",
  femorales: "isquiotibiales",
  biceps: "biceps",
  hombro: "hombro",
  hombros: "hombro",
  shoulder: "hombro",
  shoulders: "hombro",
  deltoides: "hombro",
  triceps: "triceps",
  deltoide_posterior: "deltoide_posterior",
  deltoides_posteriores: "deltoide_posterior",
  rear_delts: "deltoide_posterior",
  core: "core",
  abdomen: "core",
  abs: "core",
  pantorrillas: "pantorrillas",
  calves: "pantorrillas",
  gemelos: "pantorrillas",
};

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function volumeLandmarkFor(muscleGroup: string): VolumeLandmark | null {
  const canonical = ALIAS_TO_CANONICAL[normalize(muscleGroup)];
  if (!canonical) return null;
  return LANDMARKS_BY_CANONICAL_NAME[canonical] ?? null;
}
