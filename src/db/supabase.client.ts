import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

export function createSupabaseClient() {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " + "Please set SUPABASE_URL and SUPABASE_KEY in your environment."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
