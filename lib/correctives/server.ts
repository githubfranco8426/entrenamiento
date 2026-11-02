import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/get-authenticated-user";

export async function correctiveAccess() {
  const db = await createClient();
  const user = await getAuthenticatedUser(db);
  return { db, user };
}
