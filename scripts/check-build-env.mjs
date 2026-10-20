import nextEnv from "@next/env";
import { resolvePublicSupabaseConfig } from "../lib/supabase/resolve-public-config.mjs";

nextEnv.loadEnvConfig(process.cwd(), false);
const fields = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
};
try {
  resolvePublicSupabaseConfig({
    url: fields.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: fields.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    publishableKey: fields.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    publishableDefaultKey: fields.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  });
  console.log("Configuración pública de Supabase: disponible.");
} catch (error) {
  console.error(`Error de configuración (${process.env.VERCEL_ENV || 'local'}): ${error instanceof Error ? error.message : 'Configuración inválida'}`);
  for (const [name, value] of Object.entries(fields)) console.error(`  ${name}: ${value?.trim() ? 'configurada' : 'ausente'}`);
  process.exitCode = 1;
}
if (!process.env.GEMINI_API_KEY?.trim()) console.warn("GEMINI_API_KEY ausente: el entrenador IA de OpenGym permanecerá desactivado.");
