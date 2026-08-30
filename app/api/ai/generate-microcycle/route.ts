import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPeriodizationContext } from "@/lib/ai/context-builder";
import { generateMicrocyclePlan, PERIODIZATION_MODEL } from "@/lib/ai/client";
import type { AiTriggerType, Json } from "@/lib/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const triggerType: AiTriggerType = body.triggerType ?? "manual";

  const built = await buildPeriodizationContext(supabase, triggerType);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const { context, mesocycleId } = built;

  try {
    const result = await generateMicrocyclePlan(context);

    const { data: run, error } = await supabase
      .from("ai_periodization_runs")
      .insert({
        user_id: user.id,
        mesocycle_id: mesocycleId,
        trigger_type: triggerType,
        model_used: PERIODIZATION_MODEL,
        input_context: context as unknown as Json,
        raw_output: result.parsed ?? { stopReason: result.stopReason, thinkingSummary: result.thinkingSummary },
        status: result.parsed ? "pending_review" : "error",
        error_message: result.parsed
          ? null
          : `La IA no devolvió un plan válido (stop_reason: ${result.stopReason ?? "desconocido"})`,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ run }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido llamando a la IA";

    await supabase.from("ai_periodization_runs").insert({
      user_id: user.id,
      mesocycle_id: mesocycleId,
      trigger_type: triggerType,
      model_used: PERIODIZATION_MODEL,
      input_context: context as unknown as Json,
      raw_output: null,
      status: "error",
      error_message: message,
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
