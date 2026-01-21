/// <reference types="astro/client" />
import type { User } from "@supabase/supabase-js";
import type {
  FamilyRepository,
  EventRepository,
  UserRepository,
  ChildRepository,
  LogRepository,
  InvitationRepository,
  ExternalCalendarRepository,
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
        externalCalendar: ExternalCalendarRepository;
      };
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly OPENROUTER_API_KEY: string;
  readonly USE_IN_MEMORY_DB?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  readonly MICROSOFT_CLIENT_ID?: string;
  readonly MICROSOFT_CLIENT_SECRET?: string;
  readonly MICROSOFT_TENANT_ID?: string;
  readonly TOKEN_ENCRYPTION_KEY?: string;
  readonly OAUTH_STATE_SECRET?: string;
  readonly FRONTEND_URL?: string;
  readonly TEST_GOOGLE_EMAIL?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
