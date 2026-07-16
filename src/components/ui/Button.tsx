import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus";

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
 * Variant is intent, size is density. Both enumerate the call sites the app
 * actually has (TA-60) rather than a speculative scale.
 */

type Variant = "primary" | "secondary";
type Size = "md" | "sm" | "xs" | "icon";

// `pointer-events-none` is not belt-and-braces: CSS `:hover` still matches a
// disabled <button>, so without it the disabled send button repainted
// terracotta -> terracotta-deep and advertised itself as clickable.
const BASE = cn(
  "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
  FOCUS_RING,
);

const VARIANTS: Record<Variant, string> = {
  // `text-surface` on `bg-terracotta` is contrast-checked in both themes by
  // src/lib/theme/palette.test.ts — don't re-pick these colours by hand.
  primary: "bg-terracotta text-surface hover:bg-terracotta-deep",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm", // page-level actions (error routes, 404)
  sm: "px-4 py-2 text-sm", // inline actions (Save this trip)
  xs: "px-3 py-1 text-xs", // chips (chat quick replies)
  icon: "h-10 w-10 shrink-0 text-lg", // circular icon target (chat send)
};

/** Class string for the button skin — for `<Link>`s that should look like buttons. */
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size]);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  // `type` defaults to "button": bare <button> defaults to submit and would
  // post any enclosing form.
  return (
    <button
      type={type}
      className={cn(buttonClasses(variant, size), className)}
      {...props}
    />
  );
}
