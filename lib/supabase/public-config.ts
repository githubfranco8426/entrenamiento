import { resolvePublicSupabaseConfig } from "./resolve-public-config.mjs";

export function getPublicSupabaseConfig() {
  // Explicit references are required for Next.js to inline NEXT_PUBLIC_* in the browser.
  return resolvePublicSupabaseConfig({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    publishableDefaultKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  });
}
