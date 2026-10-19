import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select(
      "*, routines(title, day_label, routine_exercises(*, exercises(id, name, plate_increment_kg, thumbnail_url, video_url, cues, biomechanics_notes), target_sets(*))), workout_exercises(*, exercises(id, name, plate_increment_kg, thumbnail_url, video_url, cues, biomechanics_notes), set_logs(*))",
    )
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ workout: data });
}

export async function PATCH() { return NextResponse.json({ error: "Actualizá la app para editar esta sesión con guardado seguro." }, { status: 409 }); }

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
