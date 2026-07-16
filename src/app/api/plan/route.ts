import { NextResponse } from "next/server";
import { z } from "zod";
import { Message, Itinerary, TripDates } from "@/types/trip";
import { createProvider } from "@/lib/ai";
import { FakeProvider } from "@/lib/ai/fake";
import type { TravelAIProvider } from "@/lib/ai/provider";
import { createAiRateLimiter, RateLimitError } from "@/lib/ai/rate-limit";
import { planTurn, PlannerError } from "@/lib/planner/plan";
import { fakePlannerResponse } from "@/lib/planner/fake-plan";
import { resolveClimate } from "@/lib/weather/grounding";
import { climateFactsForPrompt } from "@/lib/weather/open-meteo";
import { formatTripDatesNote } from "@/lib/dates";

/**
 * Plan route (TA-17) — runs one turn of the planner brain (TA-18) server-side,
 * where the AI provider (and its secrets/CLI) lives. Guarded by the shared AI
 * rate limiter (TA-50) so the subscription/host can't be overrun.
 */
export const dynamic = "force-dynamic";

const PlanRequest = z.object({
  messages: z.array(Message).min(1),
  currentItinerary: Itinerary.optional(),
  dates: TripDates.optional(),
});

// Shared across requests so limits actually apply.
const limiter = createAiRateLimiter();

/**
 * Set `TRAVEL_AI_PROVIDER=fake` to run the deterministic offline planner — the
 * whole loop works with no real Claude (local dev / demo). Otherwise the
 * configured provider (claude-cli) is used.
 */
function resolveProvider(): TravelAIProvider {
  if (process.env.TRAVEL_AI_PROVIDER === "fake") {
    return new FakeProvider(fakePlannerResponse);
  }
  return createProvider();
}

export async function POST(request: Request) {
  let body: z.infer<typeof PlanRequest>;
  try {
    body = PlanRequest.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request: expected { messages, currentItinerary? }." },
      { status: 400 },
    );
  }

  try {
    const provider = resolveProvider();
    // Ground the plan in explicit dates (TA-57) + best-effort weather (TA-20);
    // both optional and never block planning on failure.
    const datesNote = body.dates ? formatTripDatesNote(body.dates) : null;
    const weather = await resolveClimate(body.messages, {
      dates: body.dates,
    }).catch(() => null);
    const weatherNote = weather ? climateFactsForPrompt(weather) : null;
    const grounding =
      [datesNote, weatherNote].filter(Boolean).join("\n\n") || null;
    const result = await limiter.run(() =>
      planTurn(provider, body.messages, body.currentItinerary, grounding),
    );
    // Return the structured climate too (TA-58) so the UI can show it.
    return NextResponse.json({ ...result, weather: weather ?? undefined });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Roam is busy right now — try again in a moment." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(err.retryAfterMs / 1000)),
          },
        },
      );
    }
    if (err instanceof PlannerError) {
      return NextResponse.json(
        { error: "I couldn't shape that into a plan — try rephrasing." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Something went wrong planning your trip." },
      { status: 500 },
    );
  }
}
