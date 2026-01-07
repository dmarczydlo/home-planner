import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "../db/supabase.client.ts";
import { createRepositories } from "../repositories/factory.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const useInMemory = import.meta.env.USE_IN_MEMORY_DB === "true" || import.meta.env.MODE === "test";

  let supabase: ReturnType<typeof createSupabaseClient> | undefined;
  let user: import("@supabase/supabase-js").User | null = null;

  if (!useInMemory) {
    const authHeader = context.request.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      supabase = createSupabaseClient();

      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && authUser) {
        user = authUser;

        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
        const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

        supabase = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }) as ReturnType<typeof createSupabaseClient>;
      }
    } else {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
      const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            cookie: context.request.headers.get("cookie") || "",
          },
        },
      }) as ReturnType<typeof createSupabaseClient>;

      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      if (sessionUser) {
        user = sessionUser;
      }
    }

    if (!supabase) {
      supabase = createSupabaseClient();
    }
  }

  const repositories = createRepositories(supabase);

  context.locals.repositories = repositories;
  context.locals.user = user;

  return next();
});
