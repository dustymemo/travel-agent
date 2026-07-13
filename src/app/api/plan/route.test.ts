import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";

// Weather grounding hits the network; stub it so route tests stay offline.
vi.mock("@/lib/weather/grounding", () => ({
  resolveClimate: vi.fn().mockResolvedValue(null),
}));

function post(body: unknown): Request {
  return new Request("http://localhost/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/plan", () => {
  beforeEach(() => {
    // Use the deterministic offline planner — no real Claude in tests.
    process.env.TRAVEL_AI_PROVIDER = "fake";
  });

  it("returns a validated reply + itinerary for a valid request", async () => {
    const res = await POST(
      post({ messages: [{ role: "user", content: "3 days in Vancouver" }] }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.reply).toBe("string");
    expect(json.itinerary.days.length).toBeGreaterThan(0);
  });

  it("rejects a malformed body with 400", async () => {
    const res = await POST(post({ nope: true }));
    expect(res.status).toBe(400);
  });

  it("rejects an empty message list with 400", async () => {
    const res = await POST(post({ messages: [] }));
    expect(res.status).toBe(400);
  });
});
