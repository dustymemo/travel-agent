import type { ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The small uppercase kicker above a section — "Your itinerary", "Pack",
 * "Typical · Oct".
 *
 * Polymorphic on purpose: this is a *treatment*, not an element. The kicker over
 * a fact list is a real `<h3>` and must stay one, or styling it would cost
 * screen-reader users the document outline. Callers pass `as` to keep the right
 * semantics; the look stays in one place.
 *
 * Consolidating this also settled a drift — the tracking was 0.12em in three
 * places and 0.14em in a fourth.
 */

const EYEBROW = "font-mono text-xs uppercase tracking-[0.12em] text-ink-soft";

type EyebrowProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Eyebrow<T extends ElementType = "span">({
  as,
  className,
  ...props
}: EyebrowProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  return <Tag className={cn(EYEBROW, className)} {...props} />;
}
