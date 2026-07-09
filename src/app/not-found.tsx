import Link from "next/link";

/** 404 page for unmatched routes. */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-2 flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Go home
      </Link>
    </main>
  );
}
