/**
 * @param {{ url?: string; anonKey?: string; publishableKey?: string; publishableDefaultKey?: string }} values
 * @returns {{ url: string; key: string }}
 */
export function resolvePublicSupabaseConfig(values) {
  const url = values.url?.trim();
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL. Habilítala en el entorno de este despliegue (Preview o Production).");
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL debe ser una URL HTTP/HTTPS válida.");
  }
  // Keep existing deployments on their current key; accept modern Marketplace names too.
  const key = values.anonKey?.trim() || values.publishableKey?.trim() || values.publishableDefaultKey?.trim();
  if (!key) throw new Error("Falta una clave pública de Supabase: NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Habilítala en el entorno de este despliegue.");
  if (key.startsWith('sb_secret_')) throw new Error("La configuración pública de Supabase contiene una clave secreta. Usa una clave anon o publishable.");
  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'service_role') throw new Error('SERVICE_ROLE_IN_PUBLIC_CONFIG');
    } catch (error) {
      if (error instanceof Error && error.message === 'SERVICE_ROLE_IN_PUBLIC_CONFIG') throw new Error("Una clave service_role no puede usarse en la configuración pública de Supabase.");
    }
  }
  return { url, key };
}
