import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MacrocycleBody {
  name: string;
  goal?: string | null;
  startDate: string;
  endDate?: string | null;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("macrocycles")
    .select("*, mesocycles(*, microcycles(*))")
    .order("start_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ macrocycles: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as MacrocycleBody;

  const { data, error } = await supabase
    .from("macrocycles")
    .insert({
      user_id: user.id,
      name: body.name,
      goal: body.goal ?? null,
      start_date: body.startDate,
      end_date: body.endDate ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ macrocycle: data }, { status: 201 });
}
