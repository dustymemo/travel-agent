import { describe, it, expect } from "vitest";
import { planTurn, PlannerError } from "./plan";
import { FakeProvider } from "@/lib/ai/fake";
import type { GenerateOptions } from "@/lib/ai/provider";
import type { Message } from "@/types/trip";

const validOutput = {
  reply: "Here's your Vancouver plan — enjoy!",
  itinerary: {
    summary: "3 relaxed days in Vancouver.",
    days: [
      {
        day: 1,
        title: "Arrival & Gastown",
        activities: [
          { startTime: "16:00", title: "Land at YVR", type: "transport" },
          { startTime: "19:00", title: "Dinner in Gastown", type: "food" },
        ],
      },
    ],
    packing: ["rain jacket"],
    apps: [{ name: "Transit", why: "real-time departures" }],
    tips: ["Tap a Compass Card for transit"],
    budget: [{ category: "food", amountCad: 120 }],
  },
};

const ask = (content: string): Message => ({ role: "user", content });

describe("planTurn", () => {
  it("returns a validated reply + itinerary", async () => {
    const provider = new FakeProvider(JSON.stringify(validOutput));
    const result = await planTurn(provider, [ask("3 days in Vancouver")]);
    expect(result.reply).toMatch(/vancouver plan/i);
    expect(result.itinerary.days).toHaveLength(1);
  });

  it("applies the stop-type default for activities that omit it", async () => {
    const noType = structuredClone(validOutput);
    // drop the type on the second activity
    delete (noType.itinerary.days[0].activities[1] as { type?: string }).type;
    const provider = new FakeProvider(JSON.stringify(noType));
    const result = await planTurn(provider, [ask("3 days in Vancouver")]);
    expect(result.itinerary.days[0].activities[1].type).toBe("activity");
  });

  it("passes a grounded system prompt + JSON mode to the provider", async () => {
    let seen: GenerateOptions | undefined;
    const provider = new FakeProvider((opts) => {
      seen = opts;
      return JSON.stringify(validOutput);
    });
    await planTurn(provider, [ask("plan Vancouver for me")]);
    expect(seen?.json).toBe(true);
    expect(seen?.system).toContain("Compass Card"); // grounded
    expect(seen?.prompt).toContain("plan Vancouver for me");
  });

  it("throws PlannerError when the model returns non-JSON", async () => {
    const provider = new FakeProvider("sorry, I can't do that");
    await expect(planTurn(provider, [ask("hi")])).rejects.toBeInstanceOf(
      PlannerError,
    );
  });

  it("throws PlannerError when JSON does not match the schema", async () => {
    const provider = new FakeProvider('{"reply":"hi"}'); // missing itinerary
    await expect(planTurn(provider, [ask("hi")])).rejects.toBeInstanceOf(
      PlannerError,
    );
  });

  it("retries once and succeeds when the first output is unusable", async () => {
    // The real claude CLI occasionally emits empty/non-JSON stdout; a single
    // regeneration recovers it.
    let call = 0;
    const provider = new FakeProvider(() =>
      ++call === 1 ? "" : JSON.stringify(validOutput),
    );
    const result = await planTurn(provider, [ask("3 days in Vancouver")]);
    expect(call).toBe(2);
    expect(result.itinerary.days).toHaveLength(1);
  });

  it("throws PlannerError after retries when output stays unusable", async () => {
    let call = 0;
    const provider = new FakeProvider(() => {
      call++;
      return "still not json";
    });
    await expect(planTurn(provider, [ask("hi")])).rejects.toBeInstanceOf(
      PlannerError,
    );
    expect(call).toBe(2); // one initial attempt + one retry
  });
});
