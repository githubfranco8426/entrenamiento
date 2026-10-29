import type { createClient } from "@/lib/supabase/server";

export async function getRoutineScope(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: active, error } = await supabase.from("microcycles")
    .select("id, mesocycles!inner(status), routines(id)").eq("status", "active").eq("mesocycles.status", "active").maybeSingle();
  if (error) throw new Error(error.message);
  if (active?.routines.length) return `microcycle_id.eq.${active.id}`;
  return "microcycle_id.is.null";
}
