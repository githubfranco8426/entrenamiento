import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q");

  let query = supabase.from("exercises").select("*").order("name");
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercises: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { name, muscleGroup, equipment } = body as {
    name: string;
    muscleGroup?: string;
    equipment?: string;
  };

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: user.id,
      name,
      muscle_group: muscleGroup ?? null,
      equipment: equipment ?? null,
      is_custom: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data }, { status: 201 });
}
