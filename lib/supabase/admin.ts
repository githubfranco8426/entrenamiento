import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Cliente con service role — bypassa RLS. Solo para operaciones que necesitan
 * salir del alcance del usuario autenticado actual (ej. resolver un email a un
 * user_id para invitar un atleta). Nunca exponer resultados sin validar
 * explícitamente qué puede ver quien hizo el pedido.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
