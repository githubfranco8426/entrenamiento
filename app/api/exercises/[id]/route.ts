import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { muscleGroup, equipment, thumbnailUrl, videoUrl, cues, biomechanicsNotes } = body as {
    muscleGroup?: string | null;
    equipment?: string | null;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
    cues?: string[] | null;
    biomechanicsNotes?: string | null;
  };

  const { data, error } = await supabase
    .from("exercises")
    .update({
      ...(muscleGroup !== undefined ? { muscle_group: muscleGroup } : {}),
      ...(equipment !== undefined ? { equipment } : {}),
      ...(thumbnailUrl !== undefined ? { thumbnail_url: thumbnailUrl } : {}),
      ...(videoUrl !== undefined ? { video_url: videoUrl } : {}),
      ...(cues !== undefined ? { cues } : {}),
      ...(biomechanicsNotes !== undefined ? { biomechanics_notes: biomechanicsNotes } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "No se puede borrar: el ejercicio está en uso en una rutina o un entrenamiento registrado." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
