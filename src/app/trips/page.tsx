/**
 * Trips — the user's saved plans. TA-53 lands the route + empty state; loading
 * from Supabase and rendering saved itineraries arrives in TA-54.
 */
export default function TripsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
        Roam · Trips
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ink">
        Your saved trips will live here.
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink-soft">
        Plan a trip and save it — it&apos;ll show up here to revisit, share, and
        export.
      </p>
    </div>
  );
}
