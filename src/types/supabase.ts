/**
 * Supabase `Database` types (TA-51).
 *
 * Mirrors `supabase/migrations/0001_init.sql`. Ideally regenerated from the live
 * schema so it never drifts:
 *
 *   supabase link --project-ref <your-ref>   # once
 *   npm run db:types                         # regenerates this file
 *
 * Hand-authored for now (no project linked yet); keep it in sync with the
 * migration until the CLI generates it. `data` is `Json` because the itinerary
 * shape is validated in TypeScript (Zod, src/types/trip.ts), not in Postgres.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string | null;
          section: string;
          verdict: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id?: string | null;
          section: string;
          verdict: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trip_id?: string | null;
          section?: string;
          verdict?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_trip_id_fkey";
            columns: ["trip_id"];
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
