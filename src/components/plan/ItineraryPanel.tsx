import type { Itinerary, Activity } from "@/types/trip";
import { budgetTotalCad, dayTotalCad, STOP_DOT } from "@/lib/itinerary";
import { formatCad } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

/** Told the price the traveller typed, and which stop it belongs to. */
type PriceChangeHandler = (
  dayNumber: number,
  activityIndex: number,
  priceCad: number,
) => void;

/**
 * The day-by-day itinerary panel — Roam category dots, per-day + trip totals,
 * and the packing/apps/tips the planner returns.
 *
 * Presentational and stateless: it renders whatever {@link Itinerary} it's given
 * and reports edits upward. Editing is opt-in via `onPriceChange` because the
 * same panel renders a *saved* trip in TripDetail, which must stay read-only —
 * it has nowhere to persist an edit, so it must not offer one.
 */
export function ItineraryPanel({
  itinerary,
  onPriceChange,
}: {
  itinerary: Itinerary;
  onPriceChange?: PriceChangeHandler;
}) {
  return (
    <Card as="article" className="flex flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <Eyebrow as="p">Your itinerary</Eyebrow>
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
              {/* Index keys: activities have no id, and the list is never
                  reordered or filtered here — a re-plan replaces it wholesale. */}
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
                    {a.location && (
                      <span className="block font-mono text-xs text-ink-soft">
                        {a.location}
                      </span>
                    )}
                    {a.description && (
                      <span className="block text-ink-soft">
                        {a.description}
                      </span>
                    )}
                  </span>
                  <Price
                    activity={a}
                    dayNumber={day.day}
                    index={i}
                    onPriceChange={onPriceChange}
                  />
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
    </Card>
  );
}

/**
 * A stop's ticket price: static text when read-only, a number field when the
 * parent can take an edit. Unpriced stops still get a field so a traveller can
 * add what the planner missed — but stay blank when read-only rather than
 * claiming "$0".
 */
function Price({
  activity,
  dayNumber,
  index,
  onPriceChange,
}: {
  activity: Activity;
  dayNumber: number;
  index: number;
  onPriceChange?: PriceChangeHandler;
}) {
  if (!onPriceChange) {
    if (activity.priceCad == null || activity.priceCad <= 0) return null;
    return (
      <span className="shrink-0 font-mono text-xs text-ink-soft">
        {formatCad(activity.priceCad)}
      </span>
    );
  }

  return (
    <Input
      type="number"
      min="0"
      step="1"
      inputMode="numeric"
      aria-label={`Ticket price for ${activity.title}`}
      value={activity.priceCad ?? ""}
      onChange={(e) =>
        // An empty field means free, not NaN.
        onPriceChange(dayNumber, index, Number(e.target.value) || 0)
      }
      className="w-20 shrink-0 py-1 text-right font-mono text-xs"
    />
  );
}

function FactList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <Eyebrow as="h3">{title}</Eyebrow>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
