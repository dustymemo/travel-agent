import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { optionalSupabasePublicEnv } from "@/lib/env";

/**
 * Supabase session refresh (Next.js 16 Proxy — formerly `middleware`).
 *
 * Server Components can't write cookies, so the auth session is refreshed here,
 * before routes render, and the rotated tokens are written back onto the
 * response. Without this, a logged-in user's session silently expires.
 *
 * If Supabase isn't configured (e.g. a fresh clone just trying the fake
 * planner), we skip refresh entirely so the app still runs out of the box.
 *
 * Keep this lean (see the "Proxy" docs): it runs on every matched request.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = optionalSupabasePublicEnv();
  if (!env) return response; // no Supabase configured → nothing to refresh

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching the user refreshes the session cookies when they've rotated.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)",
  ],
};
