import type { createClient } from "@/lib/supabase/server";

export async function getRoutineScope(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: active, error } = await supabase.from("microcycles")
    .select("id, mesocycles!inner(status)").eq("status", "active").eq("mesocycles.status", "active").maybeSingle();
  if (error) throw new Error(error.message);
  if (active) {
    const { count, error: countError } = await supabase.from("routines")
      .select("id", { count: "exact", head: true }).eq("microcycle_id", active.id);
    if (countError) throw new Error(countError.message);
    if (count) return `microcycle_id.eq.${active.id}`;
  }
  return "microcycle_id.is.null";
}
