/**
 * A deterministic, offline "planner" — canned Vancouver itinerary + the design's
 * refine moves (cheaper / trains / food tour). Wrap it in FakeProvider
 * (`new FakeProvider(fakePlannerResponse)`) to run the whole Plan chat loop with
 * no real Claude, for tests and local dev before the CLI provider is wired.
 *
 * It reads the latest request from `opts.prompt` and returns the JSON contract
 * that {@link planTurn} expects.
 */
import type { GenerateOptions } from "@/lib/ai/provider";
import type { PlanTurnOutput } from "@/types/trip";

function base(): PlanTurnOutput {
  return {
    reply:
      "Here's a relaxed 3 days in Vancouver — sea, mountains, and great food.",
    itinerary: {
      summary:
        "3 relaxed days in Vancouver: Gastown, Stanley Park, and Granville Island.",
      days: [
        {
          day: 1,
          title: "Arrival & Gastown",
          activities: [
            {
              startTime: "16:00",
              title: "Land at YVR, Compass Card downtown",
              type: "transport",
              priceCad: 11,
            },
            {
              startTime: "19:00",
              title: "Dinner in Gastown",
              type: "food",
              priceCad: 45,
            },
          ],
        },
        {
          day: 2,
          title: "Stanley Park & the Seawall",
          activities: [
            {
              startTime: "09:30",
              title: "Cycle the Seawall",
              type: "activity",
              priceCad: 15,
            },
            {
              startTime: "13:00",
              title: "Lunch on Denman Street",
              type: "food",
              priceCad: 25,
            },
            {
              startTime: "15:30",
              title: "Stanley Park & totem poles",
              type: "explore",
            },
          ],
        },
        {
          day: 3,
          title: "Granville Island",
          activities: [
            {
              startTime: "10:00",
              title: "Granville Island Public Market",
              type: "explore",
            },
            {
              startTime: "14:00",
              title: "Aquabus to English Bay",
              type: "activity",
              priceCad: 8,
            },
          ],
        },
      ],
      packing: [
        "light rain jacket",
        "comfortable walking shoes",
        "reusable water bottle",
      ],
      apps: [
        { name: "Transit", why: "real-time SkyTrain and bus departures" },
        { name: "TransLink", why: "official transit info + Compass Card" },
      ],
      tips: [
        "Tap your Compass Card on entry and exit for SkyTrain",
        "Listed prices are pre-tax — GST/PST is added at checkout",
      ],
      budget: [
        { category: "hotels", amountCad: 540, note: "3 nights" },
        { category: "food", amountCad: 210 },
        { category: "transit", amountCad: 40 },
        { category: "activities", amountCad: 80 },
      ],
    },
  };
}

export function fakePlannerResponse(opts: GenerateOptions): string {
  const text = opts.prompt.toLowerCase();
  const out = base();

  if (/cheap|budget|less|save/.test(text)) {
    for (const day of out.itinerary.days) {
      for (const a of day.activities) {
        if (a.priceCad) a.priceCad = Math.round(a.priceCad * 0.7);
      }
    }
    for (const line of out.itinerary.budget) {
      line.amountCad = Math.round(line.amountCad * 0.7);
    }
    out.reply =
      "Trimmed the plan to be easier on the budget — same highlights.";
  } else if (/train|transit|car/.test(text)) {
    out.itinerary.days[0].activities.unshift({
      startTime: "16:30",
      title: "Canada Line train from YVR to downtown",
      type: "transport",
      priceCad: 11,
    });
    out.reply = "Swapped to the train from the airport — cheap and quick.";
  } else if (/food|eat|restaurant|tour/.test(text)) {
    out.itinerary.days[1].activities.push({
      startTime: "18:30",
      title: "Chinatown food tour",
      type: "food",
      priceCad: 70,
    });
    out.itinerary.budget.push({ category: "activities", amountCad: 70 });
    out.reply = "Added an evening food tour through Chinatown on day 2.";
  }

  return JSON.stringify(out);
}
