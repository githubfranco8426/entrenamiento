import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("routines")
    .select(
      "*, routine_exercises(*, exercises(name, muscle_group, equipment), target_sets(*))",
    )
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ routine: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { title, dayLabel, orderIndex } = body as {
    title?: string;
    dayLabel?: string | null;
    orderIndex?: number;
  };

  const { data, error } = await supabase
    .from("routines")
    .update({
      ...(title !== undefined ? { title } : {}),
      ...(dayLabel !== undefined ? { day_label: dayLabel } : {}),
      ...(orderIndex !== undefined ? { order_index: orderIndex } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ routine: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("routines").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
