import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { muscleGroup, equipment, thumbnailUrl, videoUrl } = body as {
    muscleGroup?: string | null;
    equipment?: string | null;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
  };

  const { data, error } = await supabase
    .from("exercises")
    .update({
      ...(muscleGroup !== undefined ? { muscle_group: muscleGroup } : {}),
      ...(equipment !== undefined ? { equipment } : {}),
      ...(thumbnailUrl !== undefined ? { thumbnail_url: thumbnailUrl } : {}),
      ...(videoUrl !== undefined ? { video_url: videoUrl } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data });
}
