import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const { data, error } = await supabase
    .from("ai_periodization_runs")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      error_message: body.comment ?? null,
    })
    .eq("id", runId)
    .eq("status", "pending_review")
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ run: data });
}
