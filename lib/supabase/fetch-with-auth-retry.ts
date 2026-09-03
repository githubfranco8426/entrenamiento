import { createClient } from "@/lib/supabase/client";

/**
 * Como el middleware ya no refresca la sesión en cada llamada a /api (ver middleware.ts),
 * un entrenamiento largo (>1h, la duración típica del access token) puede toparse con un
 * 401 a mitad de sesión. Acá forzamos un refresh client-side (que @supabase/ssr persiste
 * en la cookie) y reintentamos una sola vez antes de darnos por vencidos.
 */
export async function fetchWithAuthRetry(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return res;

  return fetch(input, init);
}
