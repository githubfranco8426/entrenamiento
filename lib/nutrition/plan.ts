import type { ShiftType } from "@/lib/types/database";

export interface Meal {
  time: string;
  name: string;
  foods: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DayMealPlan {
  label: string;
  meals: Meal[];
  totalKcal: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}

/** Plan de alimentación por tipo de día — extraído de plan_nutricional_hipertrofia_turnos.pdf (sección 5). */
export const MEAL_PLAN_BY_SHIFT: Record<ShiftType, DayMealPlan> = {
  dia1_diurno: {
    label: "Turno diurno (08:00-20:00), entrenás después del trabajo",
    meals: [
      { time: "06:30", name: "Desayuno", foods: "Avena 80g + 2 huevos enteros + 3 claras + plátano 120g", kcal: 598, proteinG: 35, carbsG: 84, fatG: 16 },
      { time: "12:30", name: "Almuerzo (en trabajo)", foods: "Pechuga de pollo 220g + arroz blanco 110g crudo + verduras mixtas 150g + aceite de oliva 12g", kcal: 784, proteinG: 61, carbsG: 93, fatG: 16 },
      { time: "16:00", name: "Snack", foods: "Yogur griego natural 200g + almendras 25g + manzana 150g", kcal: 341, proteinG: 25, carbsG: 34, fatG: 13 },
      { time: "20:30-21:30", name: "Entrenamiento", foods: "Cafeína 30-40 min antes", kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      { time: "21:45", name: "Post-entreno", foods: "Proteína whey 35g + arroz blanco 80g crudo + plátano 100g", kcal: 517, proteinG: 35, carbsG: 89, fatG: 2 },
      { time: "23:00", name: "Antes de dormir", foods: "Queso cottage 180g + nueces 20g", kcal: 307, proteinG: 23, carbsG: 9, fatG: 21 },
    ],
    totalKcal: 2550,
    totalProteinG: 179,
    totalCarbsG: 308,
    totalFatG: 68,
  },
  dia2_nocturno: {
    label: "Turno nocturno (20:00-08:00), entrenás antes de entrar",
    meals: [
      { time: "14:30", name: "Al despertar", foods: "Avena 80g + 2 huevos enteros + 3 claras + plátano 120g", kcal: 598, proteinG: 35, carbsG: 84, fatG: 16 },
      { time: "16:30-17:30", name: "Entrenamiento", foods: "Cafeína 30-40 min antes", kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      { time: "17:45", name: "Post-entreno", foods: "Proteína whey 35g + arroz blanco 80g crudo + plátano 100g", kcal: 517, proteinG: 35, carbsG: 89, fatG: 2 },
      { time: "19:30", name: "Antes de entrar al turno", foods: "Pechuga de pollo 200g + arroz blanco 90g crudo + verduras 150g + aceite 10g", kcal: 672, proteinG: 55, carbsG: 77, fatG: 14 },
      { time: "00:30", name: "Durante el turno", foods: "Atún al natural 120g + camote 150g crudo + ensalada 150g", kcal: 310, proteinG: 36, carbsG: 36, fatG: 1 },
      { time: "04:00", name: "Madrugada (evitar bajón de energía)", foods: "Yogur griego 200g + almendras 35g + manzana 150g", kcal: 399, proteinG: 27, carbsG: 36, fatG: 22 },
    ],
    totalKcal: 2500,
    totalProteinG: 187,
    totalCarbsG: 320,
    totalFatG: 55,
  },
  dia3_post_nocturno_descanso: {
    label: "Post-nocturno, día de recuperación (sin entreno)",
    meals: [
      { time: "08:15", name: "Justo al salir (antes de dormir)", foods: "Batido proteína whey 25g en agua", kcal: 100, proteinG: 20, carbsG: 2, fatG: 1 },
      { time: "14:30", name: "Al despertar", foods: "3 huevos enteros + espinaca salteada 100g (aceite 5g) + avena 60g", kcal: 520, proteinG: 28, carbsG: 48, fatG: 22 },
      { time: "16:30", name: "Comida", foods: "Atún al natural 180g + camote 200g crudo + ensalada con aceite 8g", kcal: 490, proteinG: 50, carbsG: 46, fatG: 10 },
      { time: "19:30", name: "Cena", foods: "Carne magra (lomo) 200g + papa 250g crudo + verduras 150g + aceite 8g", kcal: 560, proteinG: 48, carbsG: 48, fatG: 18 },
      { time: "22:00", name: "Antes de dormir (rutina nocturna normal)", foods: "Yogur griego 250g + nueces 20g + kiwi 100g", kcal: 360, proteinG: 30, carbsG: 28, fatG: 14 },
    ],
    totalKcal: 2030,
    totalProteinG: 176,
    totalCarbsG: 172,
    totalFatG: 65,
  },
  dia4_libre: {
    label: "Libre, horario normal, entrenás por la mañana",
    meals: [
      { time: "07:30", name: "Desayuno", foods: "Avena 70g + 2 huevos enteros + 3 claras + plátano 100g", kcal: 540, proteinG: 32, carbsG: 75, fatG: 14 },
      { time: "10:00-11:00", name: "Entrenamiento", foods: "Cafeína 30-40 min antes", kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      { time: "11:15", name: "Post-entreno", foods: "Proteína whey 30g + arroz blanco 70g crudo + plátano 100g", kcal: 461, proteinG: 30, carbsG: 81, fatG: 2 },
      { time: "14:00", name: "Almuerzo", foods: "Pechuga de pollo 200g + arroz blanco 90g crudo + verduras 150g + aceite 10g", kcal: 672, proteinG: 55, carbsG: 77, fatG: 14 },
      { time: "17:00", name: "Snack", foods: "Yogur griego 200g + almendras 20g + manzana 100g", kcal: 286, proteinG: 24, carbsG: 25, fatG: 11 },
      { time: "20:00", name: "Cena", foods: "Salmón 180g + camote 180g crudo + verduras 150g + aceite 5g", kcal: 563, proteinG: 42, carbsG: 42, fatG: 25 },
    ],
    totalKcal: 2520,
    totalProteinG: 183,
    totalCarbsG: 300,
    totalFatG: 66,
  },
};

export interface Supplement {
  name: string;
  dose: string;
  timing: string;
}

/** Sección 7 del plan. Creatina y whey son diarios; el resto según corresponda al día. */
export const SUPPLEMENT_CHECKLIST: Supplement[] = [
  { name: "Creatina monohidrato", dose: "5 g/día", timing: "Cualquier momento, con una comida" },
  { name: "Proteína whey", dose: "25-35 g", timing: "Post-entreno principalmente" },
  { name: "Cafeína", dose: "3-6 mg/kg (~200-350 mg)", timing: "30-45 min pre-entreno · evitar 8-10h antes de dormir" },
  { name: "Omega-3 (EPA/DHA)", dose: "1.5-2 g/día", timing: "Con una comida principal" },
  { name: "Vitamina D3", dose: "2,000-4,000 UI/día", timing: "Con una comida que tenga grasa" },
  { name: "Magnesio", dose: "200-400 mg", timing: "Noche, antes de dormir" },
  { name: "Electrolitos", dose: "Según sudoración", timing: "En turno nocturno y días de entreno intenso" },
];

export interface HydrationTarget {
  liters: string;
  note: string;
}

/** Sección 8 del plan — 35 ml/kg de base (75 kg), ajustado por tipo de día. */
export const HYDRATION_BY_SHIFT: Record<ShiftType, HydrationTarget> = {
  dia1_diurno: { liters: "3.3-3.5 L", note: "Día de entrenamiento: base + 500-750 ml por hora entrenada." },
  dia2_nocturno: { liters: "3-3.2 L", note: "Turno nocturno: ambientes cerrados y menor percepción de sed — sumá electrolitos si hay fatiga o mareo." },
  dia3_post_nocturno_descanso: { liters: "2.8-3 L", note: "Priorizá hidratarte al despertar tras el sueño largo." },
  dia4_libre: { liters: "3.3-3.5 L", note: "Día de entrenamiento: base + 500-750 ml por hora entrenada." },
};

/** Sección 12 del plan — reemplazos con macros equivalentes. */
export const FOOD_REPLACEMENTS: { original: string; alternatives: string }[] = [
  { original: "Pechuga de pollo", alternatives: "Pavo, claras de huevo + 1 huevo entero, tofu firme (ajustar cantidad)" },
  { original: "Carne magra (lomo)", alternatives: "Pechuga de pollo, pescado blanco, lomo de cerdo magro" },
  { original: "Salmón", alternatives: "Atún fresco, sardinas, huevo entero + aceite de pescado" },
  { original: "Arroz blanco", alternatives: "Papa, camote, pasta, avena" },
  { original: "Avena", alternatives: "Pan integral, arroz inflado sin azúcar, quinoa" },
  { original: "Papa/camote", alternatives: "Arroz, plátano, calabaza" },
  { original: "Yogur griego", alternatives: "Queso cottage, kéfir natural" },
  { original: "Almendras/nueces", alternatives: "Maní natural, semillas de girasol/calabaza, aguacate (ajustar cantidad)" },
  { original: "Proteína whey", alternatives: "Caseína (mejor para pre-sueño), claras de huevo líquidas, queso cottage" },
];
