"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTrip, type SavedTrip } from "@/lib/trips/repo";
import { ItineraryPanel } from "@/components/plan/ItineraryPanel";
import { FOCUS_RING } from "@/components/ui/focus";
import { cn } from "@/lib/cn";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "missing" }
  | { status: "ready"; trip: SavedTrip };

/**
 * Read-only view of one saved trip (TA-54). Client leaf: reads the per-device
 * anonymous session's row with the browser client, then reuses the presentational
 * {@link ItineraryPanel}.
 */
export function TripDetail({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const trip = await getTrip(createSupabaseBrowserClient(), id);
        if (!active) return;
        setState(trip ? { status: "ready", trip } : { status: "missing" });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/trips"
        className={cn(
          "font-mono text-xs text-ink-soft underline underline-offset-2",
          FOCUS_RING,
        )}
      >
        ← All trips
      </Link>

      <div className="mt-6">
        {state.status === "loading" && (
          <p aria-live="polite" className="text-ink-soft">
            Loading trip…
          </p>
        )}
        {state.status === "error" && (
          <p role="alert" className="text-terracotta-deep">
            Couldn&apos;t load this trip — please refresh.
          </p>
        )}
        {state.status === "missing" && (
          <p className="text-ink-soft">
            That trip couldn&apos;t be found. It may have been removed.
          </p>
        )}
        {state.status === "ready" && (
          <ItineraryPanel itinerary={state.trip.itinerary} />
        )}
      </div>
    </main>
  );
}
