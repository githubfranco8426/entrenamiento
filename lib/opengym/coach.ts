import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { build, canonicalPlan } from "@/vendor/opengym/coach/payload.js";
import { hashPlan } from "@/vendor/opengym/coach/hash.js";
import { extractJSON, validatePlan, validateReview } from "@/vendor/opengym/coach/validate.js";
import type { OpenGymState } from "./state";

export async function propose(state: OpenGymState, userId: string, kind: "create" | "review", body: Record<string, unknown>, previous: unknown) {
  const payload = build(state, userId, { kind, intake: body.intake, note: body.note, refine: body.refine, previous });
  const prompt = (name: string) => readFileSync(path.join(process.cwd(), "vendor/opengym/coach/prompts", name), "utf8");
  const content = prompt("common.md") + "\n" + prompt(kind === "review" ? "review.md" : body.refine ? "refine.md" : "create.md") + "\nPayload:\n" + JSON.stringify(payload);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash", contents: content,
    config: { responseMimeType: "application/json", maxOutputTokens: 16000, httpOptions: { timeout: 90000 } },
  });
  const parsed = extractJSON(response.text);
  if (!parsed.value || parsed.value.coach_contract !== 1) throw new Error("El entrenador respondió con un formato inválido. No se aplicó ningún cambio.");
  const validated = kind === "review" ? validateReview(parsed.value, payload.plan) : validatePlan(parsed.value, {
    workingWeights: state.workouts.flatMap(w => w.entries.map(e => ({ id:e.id, best:Math.max(0,...e.sets.filter(s=>s.done).map(s=>s.w ?? 0)) }))), daysPerWeek: payload.coachProfile?.daysPerWeek,
    customIds: state.customEx.map(e => e.id),
  });
  if (!validated.ok) throw new Error("La propuesta no superó la validación. No se aplicó ningún cambio.");
  if ("nochange" in validated && validated.nochange) return null;
  return {
    id: crypto.randomUUID(), kind, createdAt: Date.now(), expiresAt: Date.now()+7*86400000,
    planHash: hashPlan(canonicalPlan(state)), iteration: 1,
    ...("proposal" in validated && validated.proposal ? validated.proposal : "bundle" in validated ? { bundle:validated.bundle, summary:validated.bundle.summary } : {}),
  };
}
