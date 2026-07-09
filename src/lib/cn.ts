import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names: `clsx` for conditionals/arrays/objects, then
 * `tailwind-merge` so conflicting Tailwind utilities resolve to the last one
 * (e.g. `cn("px-2", "px-4") === "px-4"`). The one place we build className
 * strings — never hand-concatenate (AGENTS.md §3).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
