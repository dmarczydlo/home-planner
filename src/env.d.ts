/// <reference types="astro/client" />
import type { User } from "@supabase/supabase-js";
import type {
  FamilyRepository,
  EventRepository,
  UserRepository,
  ChildRepository,
  LogRepository,
  InvitationRepository,
} from "./repositories/interfaces/index.ts";

declare global {
  namespace App {
    interface Locals {
      repositories: {
        family: FamilyRepository;
        event: EventRepository;
        user: UserRepository;
        child: ChildRepository;
        log: LogRepository;
        invitation: InvitationRepository;
      };
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly USE_IN_MEMORY_DB?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
