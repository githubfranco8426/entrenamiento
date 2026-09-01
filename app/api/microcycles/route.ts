import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CycleStatus } from "@/lib/types/database";

interface MicrocycleBody {
  mesocycleId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  isDeload?: boolean;
  status?: CycleStatus;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as MicrocycleBody;

  const { data, error } = await supabase
    .from("microcycles")
    .insert({
      user_id: user.id,
      mesocycle_id: body.mesocycleId,
      week_number: body.weekNumber,
      start_date: body.startDate,
      end_date: body.endDate,
      is_deload: body.isDeload ?? false,
      status: body.status ?? "planned",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ microcycle: data }, { status: 201 });
}
