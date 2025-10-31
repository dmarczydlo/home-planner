export interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  family_id: string;
  event_type: "elastic" | "blocker";
  is_all_day: boolean;
  created_at: string;
}

export interface CreateEventDTO {
  title: string;
  start_time: string;
  end_time: string;
  family_id: string;
  event_type?: "elastic" | "blocker";
  is_all_day?: boolean;
}

export interface UpdateEventDTO {
  title?: string;
  start_time?: string;
  end_time?: string;
  event_type?: "elastic" | "blocker";
  is_all_day?: boolean;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findByFamilyId(familyId: string, startDate?: Date, endDate?: Date): Promise<Event[]>;
  create(data: CreateEventDTO): Promise<Event>;
  update(id: string, data: UpdateEventDTO): Promise<Event>;
  delete(id: string): Promise<void>;
}
