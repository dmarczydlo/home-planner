import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

import { SQLFamilyRepository } from "./implementations/sql/SQLFamilyRepository.ts";
import { SQLEventRepository } from "./implementations/sql/SQLEventRepository.ts";
import { SQLUserRepository } from "./implementations/sql/SQLUserRepository.ts";
import { SQLChildRepository } from "./implementations/sql/SQLChildRepository.ts";
import { SQLLogRepository } from "./implementations/sql/SQLLogRepository.ts";
import { SQLInvitationRepository } from "./implementations/sql/SQLInvitationRepository.ts";
import { SQLExternalCalendarRepository } from "./implementations/sql/SQLExternalCalendarRepository.ts";

import { InMemoryFamilyRepository } from "./implementations/in-memory/InMemoryFamilyRepository.ts";
import { InMemoryEventRepository } from "./implementations/in-memory/InMemoryEventRepository.ts";
import { InMemoryUserRepository } from "./implementations/in-memory/InMemoryUserRepository.ts";
import { InMemoryChildRepository } from "./implementations/in-memory/InMemoryChildRepository.ts";
import { InMemoryLogRepository } from "./implementations/in-memory/InMemoryLogRepository.ts";
import { InMemoryInvitationRepository } from "./implementations/in-memory/InMemoryInvitationRepository.ts";
import { InMemoryExternalCalendarRepository } from "./implementations/in-memory/InMemoryExternalCalendarRepository.ts";

import type {
  FamilyRepository,
  EventRepository,
  UserRepository,
  ChildRepository,
  LogRepository,
  InvitationRepository,
  ExternalCalendarRepository,
} from "./interfaces/index.ts";

export type Repositories = {
  family: FamilyRepository;
  event: EventRepository;
  user: UserRepository;
  child: ChildRepository;
  log: LogRepository;
  invitation: InvitationRepository;
  externalCalendar: ExternalCalendarRepository;
};

export function createSQLRepositories(supabase: SupabaseClient<Database>): Repositories {
  return {
    family: new SQLFamilyRepository(supabase),
    event: new SQLEventRepository(supabase),
    user: new SQLUserRepository(supabase),
    child: new SQLChildRepository(supabase),
    log: new SQLLogRepository(supabase),
    invitation: new SQLInvitationRepository(supabase),
    externalCalendar: new SQLExternalCalendarRepository(supabase),
  };
}

export function createInMemoryRepositories(): Repositories {
  return {
    family: new InMemoryFamilyRepository(),
    event: new InMemoryEventRepository(),
    user: new InMemoryUserRepository(),
    child: new InMemoryChildRepository(),
    log: new InMemoryLogRepository(),
    invitation: new InMemoryInvitationRepository(),
    externalCalendar: new InMemoryExternalCalendarRepository(),
  };
}

export function createRepositories(supabase?: SupabaseClient<Database>): Repositories {
  const useInMemory = import.meta.env.USE_IN_MEMORY_DB === "true";

  const isTestMode = import.meta.env.MODE === "test";

  if (useInMemory || isTestMode) {
    return createInMemoryRepositories();
  }

  if (!supabase) {
    throw new Error(
      "Supabase client is required for SQL repositories. " + "Provide supabase client or set USE_IN_MEMORY_DB=true"
    );
  }

  return createSQLRepositories(supabase);
}
