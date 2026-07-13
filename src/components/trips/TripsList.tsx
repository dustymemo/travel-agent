"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { listTrips, type SavedTrip } from "@/lib/trips/repo";
import { budgetTotalCad } from "@/lib/itinerary";
import { formatCad } from "@/lib/money";
import { config } from "@/lib/config";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; trips: SavedTrip[] };

/**
 * Lists the signed-in user's saved trips (TA-54). A client leaf: trips live
 * behind a per-device anonymous session in the browser, so we read them with
 * the browser client on mount rather than server-side.
 */
export function TripsList() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const trips = await listTrips(createSupabaseBrowserClient());
        if (active) setState({ status: "ready", trips });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <p aria-live="polite" className="text-ink-soft">
        Loading your trips…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="text-terracotta-deep">
        Couldn&apos;t load your trips — please refresh.
      </p>
    );
  }

  if (state.trips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-soft">
        No saved trips yet. Plan one on the{" "}
        <Link
          href="/"
          className="text-terracotta-deep underline underline-offset-2"
        >
          Plan
        </Link>{" "}
        screen and hit “Save this trip”.
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {state.trips.map((trip) => (
        <li key={trip.id}>
          <Link
            href={`/trips/${trip.id}`}
            className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <h2 className="font-display text-xl leading-snug text-ink">
              {trip.title}
            </h2>
            <p className="mt-2 font-mono text-xs text-ink-soft">
              {trip.itinerary.days.length}{" "}
              {trip.itinerary.days.length === 1 ? "day" : "days"} ·{" "}
              {formatCad(budgetTotalCad(trip.itinerary))} ·{" "}
              {new Date(trip.createdAt).toLocaleDateString(config.locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
