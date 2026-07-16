import type { Climate } from "@/lib/weather/open-meteo";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Compact "typical weather" strip shown above the itinerary (TA-58). The plan
 * is already grounded in this climate (TA-20/57); this surfaces the numbers so
 * the traveler sees why the packing/pacing look the way they do. Presentational.
 */
export function WeatherBadge({ weather }: { weather: Climate }) {
  const high = Math.round(weather.avgHighC);
  const low = Math.round(weather.avgLowC);
  const rain = weather.rainyDays;

  return (
    <Card
      as="section"
      aria-label="Typical weather for your trip"
      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-surface-2 px-4 py-2 text-sm"
    >
      <Eyebrow>Typical · {weather.window}</Eyebrow>
      <span className="text-ink">
        <span className="font-medium">{high}°</span> /{" "}
        <span className="font-medium">{low}°C</span>
      </span>
      <span className="text-ink-soft">
        {rain} {rain === 1 ? "rainy day" : "rainy days"}
      </span>
    </Card>
  );
}
