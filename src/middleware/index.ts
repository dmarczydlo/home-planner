import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "../db/supabase.client.ts";
import { createRepositories } from "../repositories/factory.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const useInMemory = import.meta.env.USE_IN_MEMORY_DB === "true" || import.meta.env.MODE === "test";

  let supabase: ReturnType<typeof createSupabaseClient> | undefined;
  let user: import("@supabase/supabase-js").User | null = null;

  if (!useInMemory) {
    supabase = createSupabaseClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  }
  const repositories = createRepositories(supabase);

  context.locals.repositories = repositories;
  context.locals.user = user;

  return next();
});
