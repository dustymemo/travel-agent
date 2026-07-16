import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** 404 page for unmatched routes. */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm font-medium text-ink-soft">404</p>
      <h1 className="font-display text-2xl tracking-tight text-ink">
        Page not found
      </h1>
      <p className="max-w-md text-ink-soft">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link href="/" className={cn("mt-2", buttonClasses())}>
        Go home
      </Link>
    </main>
  );
}
