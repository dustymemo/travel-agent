"use client";

import { useEffect } from "react";

/**
 * Root error boundary — catches errors thrown in the root layout itself, which
 * `error.tsx` cannot. It replaces the whole document, so it must render its own
 * `<html>` and `<body>`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center font-sans">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          The app hit an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
