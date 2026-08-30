import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ShiftType } from "@/lib/types/database";

interface ReadinessBody {
  logDate: string;
  shiftType: ShiftType;
  willTrain: boolean;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  stressLevel?: number | null;
  muscleSoreness?: number | null;
  energyLevel?: number | null;
  notes?: string | null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "14");

  const { data, error } = await supabase
    .from("readiness_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(days);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ readinessLogs: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as ReadinessBody;

  const { data, error } = await supabase
    .from("readiness_logs")
    .upsert(
      {
        user_id: user.id,
        log_date: body.logDate,
        shift_type: body.shiftType,
        will_train: body.willTrain,
        sleep_hours: body.sleepHours ?? null,
        sleep_quality: body.sleepQuality ?? null,
        stress_level: body.stressLevel ?? null,
        muscle_soreness: body.muscleSoreness ?? null,
        energy_level: body.energyLevel ?? null,
        notes: body.notes ?? null,
      },
      { onConflict: "user_id,log_date" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ readinessLog: data });
}
