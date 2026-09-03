import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface UpdateSetBody {
  weightKg?: number | null;
  reps?: number | null;
  rpeActual?: number | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; setLogId: string }> },
) {
  const { setLogId } = await params;
  const supabase = await createClient();
  const body = (await request.json()) as UpdateSetBody;

  const { data, error } = await supabase
    .from("set_logs")
    .update({
      ...(body.weightKg !== undefined ? { weight_kg: body.weightKg } : {}),
      ...(body.reps !== undefined ? { reps: body.reps } : {}),
      ...(body.rpeActual !== undefined ? { rpe_actual: body.rpeActual } : {}),
    })
    .eq("id", setLogId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ setLog: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; setLogId: string }> },
) {
  const { setLogId } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("set_logs").delete().eq("id", setLogId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
