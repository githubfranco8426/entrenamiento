import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "20");

  let query = supabase.from("workouts").select("*, routines(title, day_label)").order("started_at", { ascending: false });
  if (searchParams.get("active") === "true") query = query.is("ended_at", null);
  const { data, error } = await query.limit(Math.max(1, Math.min(100, Number.isFinite(limit) ? limit : 20)));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workouts: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });


  const body = await request.json().catch(() => null);
  if (!body || (body.routineId != null && !/^[0-9a-f-]{36}$/i.test(body.routineId))) return NextResponse.json({ error: "Rutina inválida" }, { status: 400 });
  const { data, error } = await supabase.rpc("start_or_resume_workout", { p_routine_id: body.routineId ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "22023" ? 400 : 500 });
  return NextResponse.json(data, { status: (data as {resumed?:boolean})?.resumed ? 200 : 201 });
}
