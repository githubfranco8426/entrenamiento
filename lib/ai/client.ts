import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { PeriodizationDecisionSchema, ExerciseCuesSchema, type PeriodizationDecision, type ExerciseCues } from "@/lib/ai/schema";
import { SYSTEM_PROMPT, buildUserMessage, type PeriodizationContext } from "@/lib/ai/prompt";

export const PERIODIZATION_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini acepta JSON Schema estándar en `responseSchema` desde el SDK >=1.9 (se reenvía
// como responseJsonSchema). `$schema` no es una key soportada por el backend, se descarta.
const RESPONSE_SCHEMA = (() => {
  const schema = z.toJSONSchema(PeriodizationDecisionSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

export interface GenerateMicrocycleResult {
  parsed: PeriodizationDecision | null;
  stopReason: string | null;
  thinkingSummary: string | null;
}

export async function generateMicrocyclePlan(
  context: PeriodizationContext,
): Promise<GenerateMicrocycleResult> {
  const response = await client.models.generateContent({
    model: PERIODIZATION_MODEL,
    contents: buildUserMessage(context),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      thinkingConfig: { includeThoughts: true },
    },
  });

  const candidate = response.candidates?.[0];
  const thoughtPart = candidate?.content?.parts?.find((part) => part.thought);

  let parsed: PeriodizationDecision | null = null;
  try {
    const raw = JSON.parse(response.text ?? "");
    const result = PeriodizationDecisionSchema.safeParse(raw);
    if (result.success) parsed = result.data;
  } catch {
    parsed = null;
  }

  return {
    parsed,
    stopReason: candidate?.finishReason ?? null,
    thinkingSummary: thoughtPart?.text ?? null,
  };
}

const CUES_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const CUES_SYSTEM_PROMPT = `Sos un entrenador de fuerza y especialista en biomecánica del ejercicio. Dado el
nombre de un ejercicio (y opcionalmente su grupo muscular/equipo), devolvés:
- "cues": 3 a 5 puntos clave de ejecución, cortos y accionables, en español, en imperativo
  o como recordatorio directo (ej. "Espalda neutra durante todo el recorrido"). Pensados para
  leerse en segundos durante una serie real, no explicaciones largas.
- "biomechanicsNotes": 1-2 oraciones sobre el patrón de movimiento, articulaciones/cadena
  cinética involucradas y alguna contraindicación o precaución relevante si la hay.
Basate en biomecánica y ciencia del entrenamiento de fuerza establecida, sin inventar
afirmaciones específicas no respaldadas. Si el nombre del ejercicio es ambiguo, asumí la
variante más común en un gimnasio de fuerza/hipertrofia.`;

const CUES_RESPONSE_SCHEMA = (() => {
  const schema = z.toJSONSchema(ExerciseCuesSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

export async function generateExerciseCues(
  exerciseName: string,
  muscleGroup: string | null,
  equipment: string | null,
): Promise<ExerciseCues | null> {
  const details = [muscleGroup && `grupo muscular: ${muscleGroup}`, equipment && `equipo: ${equipment}`]
    .filter(Boolean)
    .join(" · ");

  const response = await client.models.generateContent({
    model: CUES_MODEL,
    contents: `Ejercicio: ${exerciseName}${details ? ` (${details})` : ""}`,
    config: {
      systemInstruction: CUES_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: CUES_RESPONSE_SCHEMA,
    },
  });

  try {
    const raw = JSON.parse(response.text ?? "");
    const result = ExerciseCuesSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
