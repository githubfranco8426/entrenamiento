import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select(
      "*, routines(title, day_label), workout_exercises(*, exercises(name), set_logs(*))",
    )
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ workout: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { ended, notes, durationMinutes } = body as {
    ended?: boolean;
    notes?: string;
    durationMinutes?: number;
  };

  let endedAt: string | null | undefined;
  if (ended === true) {
    if (durationMinutes !== undefined) {
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 720) {
        return NextResponse.json({ error: "La duración debe estar entre 1 y 720 minutos" }, { status: 400 });
      }

      const { data: existing, error: existingError } = await supabase
        .from("workouts")
        .select("started_at")
        .eq("id", id)
        .single();
      if (existingError || !existing) {
        return NextResponse.json({ error: existingError?.message ?? "Entrenamiento no encontrado" }, { status: 404 });
      }
      endedAt = new Date(new Date(existing.started_at).getTime() + durationMinutes * 60_000).toISOString();
    } else {
      endedAt = new Date().toISOString();
    }
  } else if (ended === false) {
    endedAt = null;
  }

  const { data, error } = await supabase
    .from("workouts")
    .update({
      ...(endedAt !== undefined ? { ended_at: endedAt } : {}),
      ...(notes !== undefined ? { notes } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workout: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
