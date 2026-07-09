import { NextResponse } from "next/server";

/**
 * Liveness probe (TA-48). Returns 200 with a tiny JSON body — no secrets, no
 * external calls, so it reflects "the server process is up and serving" without
 * flapping on downstream outages. Used by the Docker HEALTHCHECK.
 */
export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// A health probe must never be cached.
export const dynamic = "force-dynamic";
