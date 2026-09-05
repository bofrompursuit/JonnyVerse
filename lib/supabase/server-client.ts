import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let client: ReturnType<typeof createClient<Database>> | null = null;

/** Server-only Supabase client using the service role key — never import from client components. */
export function getSupabaseServerClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  client = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}
