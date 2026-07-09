"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActiveRoute } from "@/lib/nav";
import { cn } from "@/lib/cn";

/**
 * The Roam left nav rail (TA-53). Dark warm rail with a stacked list of
 * icon + label destinations; the active route is highlighted and marked
 * `aria-current="page"`. Glyphs are decorative — the text label carries meaning.
 */
export function NavRail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex w-20 shrink-0 flex-col items-center gap-2 bg-ink py-4 sm:w-24"
    >
      <Link
        href="/"
        aria-label="Roam home"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-terracotta font-display text-xl text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach"
      >
        R
      </Link>

      <ul className="flex w-full flex-col items-stretch gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 border-l-[3px] border-transparent py-3 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-peach",
                  active
                    ? "border-terracotta bg-rail-active text-surface"
                    : "text-rail-idle hover:text-surface",
                )}
              >
                <span aria-hidden className="text-lg leading-none">
                  {item.glyph}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
