"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";

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
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonClasses("secondary")}>
          Go home
        </Link>
      </div>
    </main>
  );
}
