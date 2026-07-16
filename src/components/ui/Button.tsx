import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * The Roam action button.
 *
 * Not a client component: it has no state or effects, so it renders on the
 * server and a client parent can still hand it an `onClick` (see error.tsx).
 * Keeping it server-side keeps `'use client'` at the leaves (AGENTS.md §3).
 *
 * Styling is split into {@link buttonClasses} so a `next/link` can wear the same
 * skin without pretending to be a `<button>` — an anchor that navigates must stay
 * an anchor for keyboard and screen-reader users. That's why there's no `asChild`
 * indirection here: no extra dependency, and the element stays honest.
 *
 * The full set (Card, Input, Badge, Label) lands in TA-60; this exists because
 * TA-26's error routes were repeating one button's classes three times over.
 */

type Variant = "primary" | "secondary";

const BASE =
  "flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60";

const VARIANTS: Record<Variant, string> = {
  // `text-surface` on `bg-terracotta` is contrast-checked in both themes by
  // src/lib/theme/palette.test.ts — don't re-pick these colours by hand.
  primary: "bg-terracotta text-surface hover:bg-terracotta-deep",
  secondary: "border border-line text-ink hover:bg-surface-2",
};

/** Class string for the button skin — for `<Link>`s that should look like buttons. */
export function buttonClasses(variant: Variant = "primary"): string {
  return cn(BASE, VARIANTS[variant]);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  // `type` defaults to "button": bare <button> defaults to submit and would
  // post any enclosing form.
  return (
    <button
      type={type}
      className={cn(buttonClasses(variant), className)}
      {...props}
    />
  );
}
