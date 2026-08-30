import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "20");

  const { data, error } = await supabase
    .from("workouts")
    .select("*, routines(title, day_label)")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workouts: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { routineId, microcycleId, shiftContext } = body as {
    routineId?: string;
    microcycleId?: string;
    shiftContext?: string;
  };

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      routine_id: routineId ?? null,
      microcycle_id: microcycleId ?? null,
      shift_context: (shiftContext as never) ?? null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workout: data }, { status: 201 });
}
