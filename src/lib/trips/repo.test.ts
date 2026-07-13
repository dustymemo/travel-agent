import { describe, it, expect, vi } from "vitest";
import {
  saveTrip,
  listTrips,
  getTrip,
  deriveTripTitle,
  TripsError,
} from "./repo";
import type { Itinerary } from "@/types/trip";

const itinerary: Itinerary = {
  summary: "3 relaxed days in Kyoto.",
  days: [
    {
      day: 1,
      title: "Higashiyama",
      activities: [
        { startTime: "09:00", title: "Kiyomizu-dera", type: "explore" },
      ],
    },
  ],
  packing: ["walking shoes"],
  apps: [{ name: "Suica", why: "transit" }],
  tips: ["carry cash"],
  budget: [{ category: "food", amountCad: 120 }],
};

/** A stored row as Supabase would return it (data is jsonb). */
const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: "trip-1",
  user_id: "user-1",
  title: "3 relaxed days in Kyoto.",
  data: itinerary,
  created_at: "2026-07-12T00:00:00Z",
  updated_at: "2026-07-12T00:00:00Z",
  ...over,
});

/**
 * Minimal Supabase mock: separate chains for insert vs select so both
 * `insert().select().single()` and `select().order()` / `select().eq().maybeSingle()`
 * resolve. Spies are hoisted so callers can assert arguments.
 */
function makeClient(opts: {
  user?: { id: string } | null;
  insertResult?: { data: unknown; error: unknown };
  listResult?: { data: unknown; error: unknown };
  getResult?: { data: unknown; error: unknown };
  anonId?: string;
}) {
  const insert = vi.fn((insertRow: Record<string, unknown>) => {
    void insertRow; // captured via insert.mock.calls for assertions
    return {
      select: () => ({
        single: () =>
          Promise.resolve(opts.insertResult ?? { data: row(), error: null }),
      }),
    };
  });
  const order = vi.fn(() =>
    Promise.resolve(opts.listResult ?? { data: [row()], error: null }),
  );
  const maybeSingle = vi.fn(() =>
    Promise.resolve(opts.getResult ?? { data: row(), error: null }),
  );
  const select = vi.fn(() => ({ order, eq: () => ({ maybeSingle }) }));
  const from = vi.fn(() => ({ insert, select }));

  const getUser = vi.fn().mockResolvedValue({
    data: { user: opts.user === undefined ? { id: "user-1" } : opts.user },
    error: null,
  });
  const signInAnonymously = vi.fn().mockResolvedValue({
    data: { user: { id: opts.anonId ?? "anon-1" }, session: {} },
    error: null,
  });

  const client = { from, auth: { getUser, signInAnonymously } } as never;
  return {
    client,
    spies: { from, insert, order, maybeSingle, getUser, signInAnonymously },
  };
}

describe("deriveTripTitle", () => {
  it("uses the summary, truncating long ones", () => {
    expect(deriveTripTitle(itinerary)).toBe("3 relaxed days in Kyoto.");
    const long = { ...itinerary, summary: "x".repeat(80) };
    const title = deriveTripTitle(long);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("saveTrip", () => {
  it("inserts a row for the current user and returns the saved trip", async () => {
    const { client, spies } = makeClient({ user: { id: "user-1" } });
    const saved = await saveTrip(client, itinerary);

    expect(spies.signInAnonymously).not.toHaveBeenCalled();
    const inserted = spies.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.user_id).toBe("user-1");
    expect(inserted.title).toBe("3 relaxed days in Kyoto.");
    expect(inserted.data).toEqual(itinerary);
    expect(saved.id).toBe("trip-1");
    expect(saved.itinerary.summary).toBe("3 relaxed days in Kyoto.");
  });

  it("starts a silent anonymous session when there is no user", async () => {
    const { client, spies } = makeClient({ user: null, anonId: "anon-9" });
    await saveTrip(client, itinerary);

    expect(spies.signInAnonymously).toHaveBeenCalledOnce();
    const inserted = spies.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.user_id).toBe("anon-9");
  });

  it("prefers an explicit title over the derived one", async () => {
    const { client, spies } = makeClient({ user: { id: "user-1" } });
    await saveTrip(client, itinerary, "  Kyoto with friends  ");
    const inserted = spies.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.title).toBe("Kyoto with friends");
  });

  it("throws TripsError when the insert fails", async () => {
    const { client } = makeClient({
      user: { id: "user-1" },
      insertResult: { data: null, error: { message: "denied" } },
    });
    await expect(saveTrip(client, itinerary)).rejects.toBeInstanceOf(
      TripsError,
    );
  });
});

describe("listTrips", () => {
  it("returns saved trips (newest first, itinerary validated)", async () => {
    const { client, spies } = makeClient({
      listResult: { data: [row({ id: "a" }), row({ id: "b" })], error: null },
    });
    const trips = await listTrips(client);
    expect(spies.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(trips.map((t) => t.id)).toEqual(["a", "b"]);
    expect(trips[0].itinerary.days).toHaveLength(1);
  });

  it("skips rows whose stored data is not a valid itinerary", async () => {
    const { client } = makeClient({
      listResult: {
        data: [row({ id: "good" }), row({ id: "bad", data: { nope: true } })],
        error: null,
      },
    });
    const trips = await listTrips(client);
    expect(trips.map((t) => t.id)).toEqual(["good"]);
  });

  it("returns an empty list when there are no trips", async () => {
    const { client } = makeClient({ listResult: { data: [], error: null } });
    expect(await listTrips(client)).toEqual([]);
  });

  it("throws TripsError on a query error", async () => {
    const { client } = makeClient({
      listResult: { data: null, error: { message: "boom" } },
    });
    await expect(listTrips(client)).rejects.toBeInstanceOf(TripsError);
  });
});

describe("getTrip", () => {
  it("returns the trip when found", async () => {
    const { client } = makeClient({ getResult: { data: row(), error: null } });
    const trip = await getTrip(client, "trip-1");
    expect(trip?.id).toBe("trip-1");
  });

  it("returns null when not found", async () => {
    const { client } = makeClient({ getResult: { data: null, error: null } });
    expect(await getTrip(client, "missing")).toBeNull();
  });
});
