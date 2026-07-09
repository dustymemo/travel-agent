import type { Itinerary } from "@/types/trip";
import { budgetTotalCad, dayTotalCad, STOP_DOT } from "@/lib/itinerary";
import { formatCad } from "@/lib/money";
import { cn } from "@/lib/cn";

/**
 * The live itinerary panel — a read-only day-by-day timeline with Roam category
 * dots, per-day + trip totals, and the packing/apps/tips the planner returns.
 * Presentational: it renders whatever {@link Itinerary} it's given.
 */
export function ItineraryPanel({ itinerary }: { itinerary: Itinerary }) {
  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6">
      <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-soft">
            Your itinerary
          </p>
          <h2 className="mt-1 font-display text-2xl leading-snug text-ink">
            {itinerary.summary}
          </h2>
        </div>
        <p
          className="shrink-0 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 font-display text-lg text-surface"
          aria-label={`Estimated total ${formatCad(budgetTotalCad(itinerary))}`}
        >
          {formatCad(budgetTotalCad(itinerary))}
        </p>
      </header>

      <ol className="flex flex-col gap-6">
        {itinerary.days.map((day) => (
          <li key={day.day}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg text-ink">
                <span className="font-mono text-sm text-ink-soft">
                  Day {day.day}
                </span>{" "}
                · {day.title}
              </h3>
              {dayTotalCad(day) > 0 && (
                <span className="font-mono text-xs text-ink-soft">
                  {formatCad(dayTotalCad(day))}
                </span>
              )}
            </div>
            <ul className="flex flex-col gap-2 border-l border-line pl-4">
              {day.activities.map((a, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      STOP_DOT[a.type],
                    )}
                  />
                  <time className="w-12 shrink-0 font-mono text-xs text-ink-soft">
                    {a.startTime}
                  </time>
                  <span className="flex-1 text-ink">
                    {a.title}
                    {a.description && (
                      <span className="block text-ink-soft">
                        {a.description}
                      </span>
                    )}
                  </span>
                  {a.priceCad != null && a.priceCad > 0 && (
                    <span className="shrink-0 font-mono text-xs text-ink-soft">
                      {formatCad(a.priceCad)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {(itinerary.packing.length > 0 ||
        itinerary.apps.length > 0 ||
        itinerary.tips.length > 0) && (
        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          {itinerary.packing.length > 0 && (
            <FactList title="Pack" items={itinerary.packing} />
          )}
          {itinerary.apps.length > 0 && (
            <FactList
              title="Apps"
              items={itinerary.apps.map((app) => `${app.name} — ${app.why}`)}
            />
          )}
          {itinerary.tips.length > 0 && (
            <FactList title="Local tips" items={itinerary.tips} />
          )}
        </div>
      )}
    </article>
  );
}

function FactList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="font-mono text-xs uppercase tracking-[0.12em] text-ink-soft">
        {title}
      </h3>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
