"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-segment error boundary. Catches errors thrown while rendering a route
 * or its Server Components (e.g. an AI route timing out in E3) and shows a
 * recoverable UI instead of Next.js's raw default.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side console for diagnosis; never surface internals to the user.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-2xl tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="max-w-md text-ink-soft">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center justify-center rounded-full bg-terracotta px-5 text-surface transition-colors hover:bg-terracotta-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-full border border-line px-5 text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
