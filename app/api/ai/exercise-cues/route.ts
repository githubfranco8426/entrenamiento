import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";
import { generateExerciseCues } from "@/lib/ai/client";

interface Body {
  exerciseName: string;
  muscleGroup?: string | null;
  equipment?: string | null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { exerciseName, muscleGroup, equipment } = (await request.json()) as Body;
  if (!exerciseName?.trim()) {
    return NextResponse.json({ error: "Falta el nombre del ejercicio" }, { status: 400 });
  }

  try {
    const result = await generateExerciseCues(exerciseName, muscleGroup ?? null, equipment ?? null);
    if (!result) {
      return NextResponse.json({ error: "La IA no devolvió una respuesta válida" }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido llamando a la IA";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
