/**
 * Currency formatting for the UI. Reads currency + locale from `config` so we
 * never hardcode `$`/CAD (AGENTS.md §4). Framework-free.
 */
import { config } from "./config";

/** Format an amount as a whole-dollar currency string, e.g. `$3,840`. */
export function formatCad(amount: number): string {
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
