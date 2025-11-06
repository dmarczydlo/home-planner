import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "../db/supabase.client.ts";
import { createRepositories } from "../repositories/factory.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const useInMemory = import.meta.env.USE_IN_MEMORY_DB === "true" || import.meta.env.MODE === "test";

  let supabase: ReturnType<typeof createSupabaseClient> | undefined;
  let user: import("@supabase/supabase-js").User | null = null;

  if (!useInMemory) {
    supabase = createSupabaseClient();

    const authHeader = context.request.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const { data, error } = await supabase.auth.getUser(token);

        if (!error && data.user) {
          user = data.user;
        }
      } catch (error) {
        console.error("Auth middleware error:", error);
      }
    }
  }
  const repositories = createRepositories(supabase);

  context.locals.repositories = repositories;
  context.locals.user = user;

  return next();
});
