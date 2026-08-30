import { NextResponse } from "next/server";
import { addDays, formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.activate) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data: mesocycle, error } = await supabase
    .from("mesocycles")
    .update({ status: "active" })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: existingActive } = await supabase
    .from("microcycles")
    .select("id")
    .eq("mesocycle_id", id)
    .eq("status", "active")
    .maybeSingle();

  if (!existingActive) {
    const startDate = new Date();
    const { error: microError } = await supabase.from("microcycles").insert({
      user_id: user.id,
      mesocycle_id: id,
      week_number: 1,
      start_date: formatISO(startDate, { representation: "date" }),
      end_date: formatISO(addDays(startDate, 6), { representation: "date" }),
      status: "active",
    });
    if (microError) return NextResponse.json({ error: microError.message }, { status: 500 });
  }

  return NextResponse.json({ mesocycle });
}
