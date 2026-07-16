"use client";

import { useState } from "react";
import Link from "next/link";
import type { Itinerary } from "@/types/trip";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveTrip } from "@/lib/trips/repo";
import { cn } from "@/lib/cn";

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Saves the current itinerary to Supabase (TA-54). A client leaf: it owns the
 * browser client + a silent anonymous session, so the itinerary panel stays a
 * presentational Server Component. RLS scopes the row to the signed-in user.
 */
export function SaveTripButton({ itinerary }: { itinerary: Itinerary }) {
  const [status, setStatus] = useState<SaveStatus>("idle");

  async function onSave() {
    if (status === "saving" || status === "saved") return;
    setStatus("saving");
    try {
      // Construct lazily so a missing Supabase config surfaces as an error
      // state, never a render crash (the app runs fine without Supabase).
      await saveTrip(createSupabaseBrowserClient(), itinerary);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={status === "saving" || status === "saved"}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium transition-colors",
          "bg-terracotta text-surface hover:bg-terracotta-deep",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          "disabled:opacity-60",
        )}
      >
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved ✓"
            : "Save this trip"}
      </button>

      {status === "saved" && (
        <Link
          href="/trips"
          className="text-sm text-terracotta-deep underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          View your trips
        </Link>
      )}

      <span aria-live="polite" className="sr-only">
        {status === "saved" ? "Trip saved" : ""}
      </span>

      {status === "error" && (
        <p role="alert" className="text-sm text-terracotta-deep">
          Couldn&apos;t save — try again.
        </p>
      )}
    </div>
  );
}
