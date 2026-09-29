"use server";

import { addDays, formatISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";

export async function advanceMicrocycle(formData: FormData) {
  const mesocycleId = formData.get("mesocycleId");
  if (typeof mesocycleId !== "string" || !mesocycleId) throw new Error("Mesociclo inválido");

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) throw new Error("No autenticado");

  const { data: mesocycle, error: mesocycleError } = await supabase
    .from("mesocycles")
    .select("planned_weeks")
    .eq("id", mesocycleId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (mesocycleError) throw new Error(mesocycleError.message);
  if (!mesocycle) throw new Error("No encontré el mesociclo activo");

  const { data: activeMicrocycle, error: activeMicrocycleError } = await supabase
    .from("microcycles")
    .select("id, week_number, end_date")
    .eq("mesocycle_id", mesocycleId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (activeMicrocycleError) throw new Error(activeMicrocycleError.message);
  if (!activeMicrocycle) throw new Error("No hay una semana activa para avanzar");
  if (activeMicrocycle.week_number >= mesocycle.planned_weeks) {
    throw new Error("Este mesociclo ya está en su última semana");
  }

  const nextStart = addDays(new Date(`${activeMicrocycle.end_date}T00:00:00`), 1);
  const { error: completeError } = await supabase
    .from("microcycles")
    .update({ status: "completed" })
    .eq("id", activeMicrocycle.id)
    .eq("user_id", user.id);
  if (completeError) throw new Error(completeError.message);

  const { error: nextMicrocycleError } = await supabase.from("microcycles").insert({
    user_id: user.id,
    mesocycle_id: mesocycleId,
    week_number: activeMicrocycle.week_number + 1,
    start_date: formatISO(nextStart, { representation: "date" }),
    end_date: formatISO(addDays(nextStart, 6), { representation: "date" }),
    status: "active",
  });
  if (nextMicrocycleError) throw new Error(nextMicrocycleError.message);

  revalidatePath("/dashboard");
  revalidatePath("/program");
  revalidatePath("/calendar");
  revalidatePath("/data");
}
