"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
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
        <Button onClick={reset}>Try again</Button>
      </body>
    </html>
  );
}
