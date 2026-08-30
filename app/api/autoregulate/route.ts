import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestNextLoad } from "@/lib/autoregulation/engine";

interface AutoregulateBody {
  setLogId: string;
  targetReps: number;
  targetRpe: number;
  actualWeightKg: number;
  actualReps: number;
  actualRpe: number;
  plateIncrementKg?: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as AutoregulateBody;

  const result = suggestNextLoad({
    targetReps: body.targetReps,
    targetRpe: body.targetRpe,
    actualWeightKg: body.actualWeightKg,
    actualReps: body.actualReps,
    actualRpe: body.actualRpe,
    plateIncrementKg: body.plateIncrementKg ?? 2.5,
  });

  const { data, error } = await supabase
    .from("autoregulation_suggestions")
    .insert({
      user_id: user.id,
      set_log_id: body.setLogId,
      target_rpe: body.targetRpe,
      actual_rpe: body.actualRpe,
      suggested_weight_kg: result.suggestedWeightKg,
      suggested_reps: result.suggestedReps,
      rationale: result.rationale,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suggestion: data, ...result });
}
