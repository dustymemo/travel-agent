import { describe, it, expect } from "vitest";
import { buildPlannerRequest } from "./prompt";
import type { Message, Itinerary } from "@/types/trip";

const say = (content: string): Message => ({ role: "user", content });

describe("buildPlannerRequest", () => {
  it("states the JSON reply+itinerary contract", () => {
    const { system } = buildPlannerRequest([say("plan me a trip")]);
    expect(system).toMatch(/json/i);
    expect(system).toContain("reply");
    expect(system).toContain("itinerary");
  });

  it("pins currency + units from config (CAD, metric)", () => {
    const { system } = buildPlannerRequest([say("plan me a trip")]);
    expect(system).toContain("CAD");
    expect(system).toMatch(/metric/i);
  });

  it("grounds the prompt with verified facts for a known city", () => {
    const { system } = buildPlannerRequest([
      say("5 relaxed days in Vancouver, love food"),
    ]);
    expect(system).toContain("Compass Card");
    expect(system).toContain("911");
  });

  it("adds no city facts when no known city is mentioned", () => {
    const { system } = buildPlannerRequest([say("somewhere sunny for a week")]);
    expect(system).not.toMatch(/verified local facts/i);
  });

  it("asks to refine the existing itinerary when one is passed", () => {
    const current: Itinerary = {
      summary: "A draft Lisbon trip",
      days: [],
      packing: [],
      apps: [{ name: "Bolt", why: "taxis" }],
      tips: [],
      budget: [],
    };
    const { system } = buildPlannerRequest([say("make it cheaper")], current);
    expect(system).toMatch(/current itinerary/i);
    expect(system).toContain("A draft Lisbon trip");
  });

  it("carries the conversation into the user prompt", () => {
    const { prompt } = buildPlannerRequest([
      say("3 days in Vancouver"),
      { role: "assistant", content: "Done!" },
      say("add a food tour"),
    ]);
    expect(prompt).toContain("3 days in Vancouver");
    expect(prompt).toContain("add a food tour");
  });
});
