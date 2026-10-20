import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { getPublicSupabaseConfig } from "./public-config";

export function createClient() {
  const { url, key } = getPublicSupabaseConfig();
  return createBrowserClient<Database>(
    url,
    key,
  );
}
