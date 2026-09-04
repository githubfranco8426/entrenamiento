import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BodyMetricBody {
  logDate: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  notes?: string | null;
  photoPath?: string | null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "90");

  const { data, error } = await supabase
    .from("body_metrics")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(days);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bodyMetrics: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as BodyMetricBody;

  const { data, error } = await supabase
    .from("body_metrics")
    .upsert(
      {
        user_id: user.id,
        log_date: body.logDate,
        weight_kg: body.weightKg ?? null,
        body_fat_pct: body.bodyFatPct ?? null,
        notes: body.notes ?? null,
        ...(body.photoPath !== undefined ? { photo_path: body.photoPath } : {}),
      },
      { onConflict: "user_id,log_date" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bodyMetric: data });
}
