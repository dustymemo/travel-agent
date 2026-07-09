/**
 * Plan — the home route and heart of Roam. TA-53 lands the shell + a grounded
 * placeholder; the conversational composer + live itinerary panel arrive in
 * TA-17, powered by the planner brain (TA-18).
 */
export default function PlanPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
        Roam · Plan
      </p>
      <h1 className="mt-4 max-w-xl font-display text-4xl leading-tight text-ink sm:text-5xl">
        Tell Roam your dates and vibe. Get a whole trip in a minute.
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink-soft">
        The conversational planner is coming next — describe a trip in your own
        words and watch a day-by-day itinerary build itself.
      </p>
    </div>
  );
}
