"use client";

import { useState } from "react";
import Link from "next/link";
import type { Itinerary } from "@/types/trip";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveTrip } from "@/lib/trips/repo";
import { Button } from "@/components/ui/Button";
import { FOCUS_RING } from "@/components/ui/focus";
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
      <Button
        size="sm"
        onClick={onSave}
        disabled={status === "saving" || status === "saved"}
      >
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved ✓"
            : "Save this trip"}
      </Button>

      {status === "saved" && (
        <Link
          href="/trips"
          className={cn(
            "text-sm text-terracotta-deep underline underline-offset-2",
            FOCUS_RING,
          )}
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
