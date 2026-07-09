import { config } from "@/lib/config";

interface VerifiedSourceProps {
  /** The cited source URL (validated upstream by the CityData schema). */
  source: string;
  /** ISO date (YYYY-MM-DD) the fact was last checked against the source. */
  lastVerified: string;
  /** Optional extra classes for layout at the call site. */
  className?: string;
}

/** Hostname without a leading `www.`, e.g. `translink.ca`. */
function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Format an ISO date in UTC so the rendered string is stable regardless of the
 * viewer's timezone. Parsing the parts avoids the `new Date("YYYY-MM-DD")`
 * UTC-midnight-shifts-a-day trap.
 */
function formatVerifiedDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(config.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * A small "Verified source · {date}" badge that links to the citation behind a
 * city fact. Every fact we surface is source-cited (E2), and this makes that
 * provenance visible and clickable in the UI (used from E6 screens onward).
 *
 * Accessibility: a real `<a>` (keyboard-focusable, visible focus ring), an
 * `aria-label` naming the host + date, and a decorative, `aria-hidden` icon.
 */
export function VerifiedSource({
  source,
  lastVerified,
  className,
}: VerifiedSourceProps) {
  const host = sourceHost(source);
  const date = formatVerifiedDate(lastVerified);

  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Verified source: ${host}, last verified ${date}`}
      className={[
        "inline-flex items-center gap-1 rounded text-xs font-medium text-emerald-700",
        "hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        "dark:text-emerald-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.55a1 1 0 0 1-1.42 0l-3.5-3.53a1 1 0 1 1 1.42-1.408l2.79 2.812 6.79-6.84a1 1 0 0 1 1.414-.007Z"
          clipRule="evenodd"
        />
      </svg>
      <span>Verified source · {date}</span>
    </a>
  );
}
