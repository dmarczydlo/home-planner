import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

export function createSupabaseClient() {
  const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Please set SUPABASE_URL and SUPABASE_KEY (or PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY) in your environment."
    );
  }

  if (!supabaseAnonKey.startsWith("eyJ")) {
    throw new Error(
      `Invalid Supabase API key format. Expected JWT token starting with 'eyJ', but got: ${supabaseAnonKey.substring(0, 20)}...`
    );
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return client;
}
