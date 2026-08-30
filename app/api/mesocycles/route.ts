import { NextResponse } from "next/server";
import { addDays, formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { MesocyclePhase } from "@/lib/types/database";

interface MesocycleBody {
  macrocycleId: string;
  name: string;
  phase: MesocyclePhase;
  orderIndex: number;
  plannedWeeks: number;
  activate?: boolean;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesocycles")
    .select("*, macrocycles(name), microcycles(*)")
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mesocycles: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as MesocycleBody;

  const { data: mesocycle, error } = await supabase
    .from("mesocycles")
    .insert({
      user_id: user.id,
      macrocycle_id: body.macrocycleId,
      name: body.name,
      phase: body.phase,
      order_index: body.orderIndex,
      planned_weeks: body.plannedWeeks,
      status: body.activate ? "active" : "planned",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.activate) {
    const startDate = new Date();
    const { error: microError } = await supabase.from("microcycles").insert({
      user_id: user.id,
      mesocycle_id: mesocycle.id,
      week_number: 1,
      start_date: formatISO(startDate, { representation: "date" }),
      end_date: formatISO(addDays(startDate, 6), { representation: "date" }),
      status: "active",
    });
    if (microError) return NextResponse.json({ error: microError.message }, { status: 500 });
  }

  return NextResponse.json({ mesocycle }, { status: 201 });
}
