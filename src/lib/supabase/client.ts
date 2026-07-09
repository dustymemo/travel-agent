import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

/** Browser-side Supabase client (uses the public anon key + RLS). */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = supabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
