import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildPeriodizationContext } from "@/lib/ai/context-builder";
import { generateMicrocyclePlan, PERIODIZATION_MODEL } from "@/lib/ai/client";
import type { Database, Json } from "@/lib/types/database";

// Corre semanalmente vía Vercel Cron (ver vercel.json). No usa cookies de sesión —
// el service role bypassa RLS porque este endpoint corre sin usuario autenticado.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: mesocycle } = await supabase
    .from("mesocycles")
    .select("id, planned_weeks, user_id")
    .eq("status", "active")
    .maybeSingle();

  if (!mesocycle) {
    return NextResponse.json({ skipped: true, reason: "No hay mesociclo activo" });
  }

  const { data: activeMicrocycle } = await supabase
    .from("microcycles")
    .select("id, week_number, end_date")
    .eq("mesocycle_id", mesocycle.id)
    .eq("status", "active")
    .maybeSingle();

  if (!activeMicrocycle) {
    return NextResponse.json({ skipped: true, reason: "No hay microciclo activo" });
  }

  const today = new Date();
  const endDate = new Date(activeMicrocycle.end_date);
  if (today < endDate) {
    return NextResponse.json({
      skipped: true,
      reason: `El microciclo activo termina el ${activeMicrocycle.end_date}, todavía no corresponde generar el siguiente.`,
    });
  }

  const triggerType =
    activeMicrocycle.week_number >= mesocycle.planned_weeks ? "end_of_mesocycle" : "end_of_microcycle";

  const built = await buildPeriodizationContext(
    supabase as unknown as Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
    triggerType,
  );

  if ("error" in built) {
    return NextResponse.json({ skipped: true, reason: built.error });
  }

  const { context, mesocycleId } = built;
  const result = await generateMicrocyclePlan(context);

  const { data: run, error } = await supabase
    .from("ai_periodization_runs")
    .insert({
      user_id: mesocycle.user_id,
      mesocycle_id: mesocycleId,
      trigger_type: triggerType,
      model_used: PERIODIZATION_MODEL,
      input_context: context as unknown as Json,
      raw_output: result.parsed ?? { stopReason: result.stopReason },
      status: result.parsed ? "pending_review" : "error",
      error_message: result.parsed
        ? null
        : `La IA no devolvió un plan válido (stop_reason: ${result.stopReason ?? "desconocido"})`,
    })
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ run });
}
