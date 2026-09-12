import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface UpdateLinkBody {
  status: "active" | "revoked";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  const supabase = await createClient();
  const body = (await request.json()) as UpdateLinkBody;

  if (body.status !== "active" && body.status !== "revoked") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("coach_athlete_links")
    .update({
      status: body.status,
      ...(body.status === "active" ? { accepted_at: new Date().toISOString() } : {}),
    })
    .eq("id", linkId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("coach_athlete_links").delete().eq("id", linkId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
