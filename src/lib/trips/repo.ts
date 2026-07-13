/**
 * Trips data-access (TA-54). Framework-free: every function takes a Supabase
 * client so it's reusable from a Server Component, Route Handler, or the
 * browser, and fully unit-testable against a mock (see repo.test.ts).
 *
 * Security is Row-Level Security (migration 0001): the anon key can only ever
 * touch the signed-in user's own rows, so we never filter by user_id on read.
 * Identity is a silent anonymous session (per-device) created on first save.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Itinerary } from "@/types/trip";
import type { Database, Json } from "@/types/supabase";

export type TripsClient = SupabaseClient<Database>;

/** A saved trip as the app uses it — itinerary validated out of jsonb. */
export interface SavedTrip {
  id: string;
  title: string;
  itinerary: Itinerary;
  createdAt: string;
}

/** Thrown when a trip can't be saved or loaded (session or query failure). */
export class TripsError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "TripsError";
  }
}

const MAX_TITLE = 60;

/** A short, human title derived from the itinerary summary. */
export function deriveTripTitle(itinerary: Itinerary): string {
  const s = itinerary.summary.trim();
  if (s.length <= MAX_TITLE) return s;
  return s.slice(0, MAX_TITLE - 1).trimEnd() + "…";
}

/**
 * The signed-in user's id, creating a silent anonymous session if none exists.
 * Anonymous auth keeps the MVP loop friction-free; a real account can be linked
 * later without changing this contract.
 */
export async function ensureUserId(client: TripsClient): Promise<string> {
  const { data } = await client.auth.getUser();
  if (data.user) return data.user.id;

  const { data: anon, error } = await client.auth.signInAnonymously();
  if (error || !anon.user) {
    throw new TripsError("Could not start a session to save your trip.", error);
  }
  return anon.user.id;
}

/** Persist an itinerary as a new trip. Returns the saved record. */
export async function saveTrip(
  client: TripsClient,
  itinerary: Itinerary,
  title?: string,
): Promise<SavedTrip> {
  const userId = await ensureUserId(client);

  const insert: Database["public"]["Tables"]["trips"]["Insert"] = {
    user_id: userId,
    title: title?.trim() || deriveTripTitle(itinerary),
    data: itinerary as unknown as Json,
  };

  const { data, error } = await client
    .from("trips")
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    throw new TripsError("Could not save your trip.", error);
  }
  return toSavedTrip(data);
}

/** The signed-in user's saved trips, newest first. */
export async function listTrips(client: TripsClient): Promise<SavedTrip[]> {
  const { data, error } = await client
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new TripsError("Could not load your trips.", error);
  }
  // Defensive: skip any row whose stored data no longer matches the schema
  // rather than failing the whole list.
  return (data ?? [])
    .map(toSavedTripSafe)
    .filter((t): t is SavedTrip => t !== null);
}

/** One saved trip by id, or null if it doesn't exist / isn't the user's. */
export async function getTrip(
  client: TripsClient,
  id: string,
): Promise<SavedTrip | null> {
  const { data, error } = await client
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new TripsError("Could not load that trip.", error);
  }
  return data ? toSavedTrip(data) : null;
}

type TripRow = Database["public"]["Tables"]["trips"]["Row"];

function toSavedTrip(row: TripRow): SavedTrip {
  return {
    id: row.id,
    title: row.title,
    itinerary: Itinerary.parse(row.data),
    createdAt: row.created_at,
  };
}

function toSavedTripSafe(row: TripRow): SavedTrip | null {
  const parsed = Itinerary.safeParse(row.data);
  if (!parsed.success) return null;
  return {
    id: row.id,
    title: row.title,
    itinerary: parsed.data,
    createdAt: row.created_at,
  };
}
