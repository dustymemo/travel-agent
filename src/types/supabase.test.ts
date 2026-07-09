import { describe, it, expectTypeOf } from "vitest";
import type { Database } from "@/types/supabase";

// Type-level checks (verified by `npm run typecheck`; no-ops at runtime) that
// the generated Database types match the migration and flow through queries.
describe("Database types", () => {
  it("types a trips row", () => {
    type TripRow = Database["public"]["Tables"]["trips"]["Row"];
    expectTypeOf<TripRow["id"]>().toEqualTypeOf<string>();
    expectTypeOf<TripRow["user_id"]>().toEqualTypeOf<string>();
    expectTypeOf<TripRow["title"]>().toEqualTypeOf<string>();
  });

  it("makes feedback.trip_id and note nullable, matching the schema", () => {
    type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];
    expectTypeOf<FeedbackRow["trip_id"]>().toEqualTypeOf<string | null>();
    expectTypeOf<FeedbackRow["note"]>().toEqualTypeOf<string | null>();
  });

  it("lets Insert omit server-defaulted columns", () => {
    type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
    // id/title/timestamps are optional (DB defaults); user_id + data required.
    expectTypeOf<{ user_id: string; data: null }>().toMatchTypeOf<TripInsert>();
  });
});
