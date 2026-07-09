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
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-full border border-black/[.08] px-5 transition-colors hover:bg-black/[.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
