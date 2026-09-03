import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SettingsBody {
  goal?: string | null;
  experienceYears?: number | null;
  shiftAnchorDate?: string | null;
  defaultPlateIncrementKg?: number;
  injuryHistory?: string | null;
  medicalNotes?: string | null;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_settings").select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as SettingsBody;

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        goal: body.goal ?? null,
        experience_years: body.experienceYears ?? null,
        shift_anchor_date: body.shiftAnchorDate ?? null,
        default_plate_increment_kg: body.defaultPlateIncrementKg ?? 2.5,
        injury_history: body.injuryHistory ?? null,
        medical_notes: body.medicalNotes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
