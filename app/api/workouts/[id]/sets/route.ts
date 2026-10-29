import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_exercises")
    .select("*, exercises(name), set_logs(*)")
    .eq("workout_id", id)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workoutExercises: data });
}

export async function POST() { return NextResponse.json({ error: "Actualizá la app para registrar con guardado seguro." }, { status: 409 }); }
