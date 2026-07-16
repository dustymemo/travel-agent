import type { ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus";

/**
 * A panel surface: the itinerary, a saved-trip tile, the weather strip, the
 * "nothing here yet" placeholders.
 *
 * Polymorphic for the same reason as {@link Eyebrow} — the itinerary is an
 * `<article>` and the weather strip a `<section>`, and a wrapper that flattened
 * them to `<div>`s would throw away the semantics. {@link cardClasses} is
 * exported for surfaces that are already another component (the trip tiles are
 * `next/link`s, which must stay anchors).
 *
 * Colours come from the tokens the contrast contract checks, so a card cannot
 * drift out of AA in either theme.
 */

type Variant = "solid" | "interactive" | "empty";

const BASE = "rounded-2xl border border-line";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-surface",
  // Carries its own focus ring: this variant is worn by links and buttons.
  interactive: cn(
    "bg-surface transition-colors hover:bg-surface-2",
    FOCUS_RING,
  ),
  // No fill — an empty state should read as an absence, not a populated panel.
  empty: "border-dashed text-center text-ink-soft",
};

/** Class string for the card surface — for links/buttons that are already an element. */
export function cardClasses(variant: Variant = "solid"): string {
  return cn(BASE, VARIANTS[variant]);
}

type CardProps<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Card<T extends ElementType = "div">({
  as,
  variant = "solid",
  className,
  ...props
}: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return <Tag className={cn(cardClasses(variant), className)} {...props} />;
}
