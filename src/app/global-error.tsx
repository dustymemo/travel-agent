"use client";

import { useEffect } from "react";
// This route replaces the root layout, so it does not inherit the layout's
// stylesheet import — without this the tokens below would render unstyled.
import "./globals.css";

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
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-6 text-center font-sans">
        <h1 className="font-display text-2xl tracking-tight text-ink">
          Something went wrong
        </h1>
        <p className="max-w-md text-ink-soft">
          The app hit an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center justify-center rounded-full bg-terracotta px-5 text-surface transition-colors hover:bg-terracotta-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
