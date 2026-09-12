import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Verifica al usuario autenticado a partir del JWT ya presente en las cookies.
 *
 * auth.getUser() SIEMPRE hace un round-trip de red a Supabase Auth para validar el
 * token — eso agrega ~150-400ms a cada guardado (registrar set, guardar ajustes,
 * readiness, etc.), que además se sienten sobre todo con latencia a la región del
 * proyecto (sa-east-1). El proyecto usa firma JWT asimétrica (ES256, confirmado
 * contra /auth/v1/.well-known/jwks.json), así que getClaims() puede verificar la
 * firma localmente con WebCrypto sin ida y vuelta — RLS sigue siendo la barrera de
 * seguridad real en la base de datos, esto solo evita repetir esa verificación acá.
 */
export async function getAuthenticatedUser(
  supabase: SupabaseServerClient,
): Promise<{ id: string; email: string | null } | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const claims = data.claims as { sub: string; email?: string };
  return { id: claims.sub, email: claims.email ?? null };
}
