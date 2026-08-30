import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { PeriodizationDecisionSchema, type PeriodizationDecision } from "@/lib/ai/schema";
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
