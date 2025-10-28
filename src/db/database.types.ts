export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      children: {
        Row: {
          created_at: string;
          family_id: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          family_id: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          family_id?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      event_exceptions: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          is_cancelled: boolean;
          new_end_time: string | null;
          new_start_time: string | null;
          original_date: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          is_cancelled?: boolean;
          new_end_time?: string | null;
          new_start_time?: string | null;
          original_date: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          is_cancelled?: boolean;
          new_end_time?: string | null;
          new_start_time?: string | null;
          original_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_exceptions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_participants: {
        Row: {
          child_id: string;
          event_id: string;
          participant_type: string;
          user_id: string;
        };
        Insert: {
          child_id: string;
          event_id: string;
          participant_type: string;
          user_id: string;
        };
        Update: {
          child_id?: string;
          event_id?: string;
          participant_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_participants_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          end_time: string;
          event_type: Database["public"]["Enums"]["event_type_enum"];
          external_calendar_id: string | null;
          family_id: string;
          id: string;
          is_all_day: boolean;
          is_synced: boolean;
          recurrence_pattern: Json | null;
          start_time: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          event_type?: Database["public"]["Enums"]["event_type_enum"];
          external_calendar_id?: string | null;
          family_id: string;
          id?: string;
          is_all_day?: boolean;
          is_synced?: boolean;
          recurrence_pattern?: Json | null;
          start_time: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          event_type?: Database["public"]["Enums"]["event_type_enum"];
          external_calendar_id?: string | null;
          family_id?: string;
          id?: string;
          is_all_day?: boolean;
          is_synced?: boolean;
          recurrence_pattern?: Json | null;
          start_time?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_external_calendar_id_fkey";
            columns: ["external_calendar_id"];
            isOneToOne: false;
            referencedRelation: "external_calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      external_calendars: {
        Row: {
          access_token: string;
          account_email: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          last_synced_at: string | null;
          provider: string;
          refresh_token: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          account_email: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          last_synced_at?: string | null;
          provider: string;
          refresh_token: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          account_email?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          last_synced_at?: string | null;
          provider?: string;
          refresh_token?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "external_calendars_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      families: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          family_id: string;
          joined_at: string;
          role: Database["public"]["Enums"]["family_role_enum"];
          user_id: string;
        };
        Insert: {
          family_id: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["family_role_enum"];
          user_id: string;
        };
        Update: {
          family_id?: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["family_role_enum"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          created_at: string;
          expires_at: string;
          family_id: string;
          id: string;
          invited_by: string;
          invitee_email: string;
          status: Database["public"]["Enums"]["invitation_status_enum"];
          token: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          family_id: string;
          id?: string;
          invited_by: string;
          invitee_email: string;
          status?: Database["public"]["Enums"]["invitation_status_enum"];
          token: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          family_id?: string;
          id?: string;
          invited_by?: string;
          invitee_email?: string;
          status?: Database["public"]["Enums"]["invitation_status_enum"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      logs: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_type: Database["public"]["Enums"]["actor_type_enum"];
          created_at: string;
          details: Json | null;
          family_id: string | null;
          id: number;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_type: Database["public"]["Enums"]["actor_type_enum"];
          created_at?: string;
          details?: Json | null;
          family_id?: string | null;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_type?: Database["public"]["Enums"]["actor_type_enum"];
          created_at?: string;
          details?: Json | null;
          family_id?: string | null;
          id?: never;
        };
        Relationships: [
          {
            foreignKeyName: "logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_family_admin: {
        Args: { p_family_id: string };
        Returns: boolean;
      };
      is_family_member: {
        Args: { p_family_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      actor_type_enum: "user" | "system";
      event_type_enum: "elastic" | "blocker";
      family_role_enum: "admin" | "member";
      invitation_status_enum: "pending" | "accepted" | "expired";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      actor_type_enum: ["user", "system"],
      event_type_enum: ["elastic", "blocker"],
      family_role_enum: ["admin", "member"],
      invitation_status_enum: ["pending", "accepted", "expired"],
    },
  },
} as const;
