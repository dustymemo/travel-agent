import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus";

/**
 * A text/date input on the Roam field surface.
 *
 * Not polymorphic — an input is an input. Labels stay at the call site because
 * they differ structurally: the date range wraps its inputs in a visible
 * `<label>`, while the chat field uses a visually-hidden one. Bundling a label
 * in here would force one of those to lie.
 *
 * `bg-field` matters: these were hardcoded `bg-white` before TA-26, which is
 * exactly the kind of literal that cannot flip for dark mode.
 */

type Variant = "field" | "pill";

const BASE = cn(
  "border border-line bg-field text-sm text-ink placeholder:text-ink-soft",
  FOCUS_RING,
);

const VARIANTS: Record<Variant, string> = {
  field: "rounded-lg px-3 py-1.5",
  pill: "rounded-full px-4 py-2.5",
};

/** Class string for the input skin. */
export function inputClasses(variant: Variant = "field"): string {
  return cn(BASE, VARIANTS[variant]);
}

type InputProps = ComponentProps<"input"> & { variant?: Variant };

export function Input({ variant = "field", className, ...props }: InputProps) {
  return <input className={cn(inputClasses(variant), className)} {...props} />;
}
