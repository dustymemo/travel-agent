import { TripsList } from "@/components/trips/TripsList";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Trips (TA-54) — the user's saved plans. A Server Component shell; the list
 * itself is a client leaf because trips live behind a per-device anonymous
 * session in the browser.
 */
export default function TripsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Eyebrow as="p">Roam · Trips</Eyebrow>
      <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
        Your saved trips
      </h1>
      <p className="mt-2 mb-8 text-lg text-ink-soft">
        Revisit a plan, or start a new one on the Plan screen.
      </p>
      <TripsList />
    </main>
  );
}
