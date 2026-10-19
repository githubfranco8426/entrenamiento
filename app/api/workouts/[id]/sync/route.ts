import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";
import { operationSchema } from "@/lib/workouts/model";
import type { Json } from "@/lib/types/database";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user || request.headers.get("X-Workout-User") !== user.id) return NextResponse.json({ error: "Iniciá sesión con la cuenta de este entrenamiento." }, { status: 401 });
  const parsed = operationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Operación inválida: revisá carga, repeticiones y esfuerzo." }, { status: 400 });
  const { data, error } = await supabase.rpc("sync_workout", { p_workout_id: id, p_operation: parsed.data as unknown as Json });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : error.code === "22023" ? 400 : error.code === "42501" ? 403 : 500 });
  const result = data as { conflict?: boolean; revision: number };
  return NextResponse.json(result, { status: result.conflict ? 409 : 200 });
}
