/**
 * Validated environment access (boundary safety).
 *
 * Reads `process.env` through Zod so a missing/misconfigured variable fails
 * loudly with a clear message instead of surfacing as a cryptic error deep
 * inside a client. Kept framework-free (see AGENTS.md §2).
 *
 * NOTE: the `process.env.NEXT_PUBLIC_*` member accesses must stay literal —
 * Next.js statically inlines them into the browser bundle at build time.
 */
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/**
 * The public (browser-safe) Supabase config. Throws if either variable is
 * missing or malformed, naming the offending variable(s).
 */
export function supabasePublicEnv(): { url: string; anonKey: string } {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const bad = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Invalid or missing Supabase environment variable(s): ${bad}. ` +
        `Set them in .env (see .env.example).`,
    );
  }

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Like {@link supabasePublicEnv} but returns `null` instead of throwing when
 * Supabase isn't configured. Lets the app run out-of-the-box on a fresh clone
 * (e.g. trying the fake planner) — the proxy simply skips session refresh when
 * there's no project to talk to.
 */
export function optionalSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} | null {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return parsed.success
    ? {
        url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    : null;
}
