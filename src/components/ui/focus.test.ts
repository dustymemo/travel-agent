import { describe, it, expect } from "vitest";
import { FOCUS_RING, FOCUS_RING_RAIL } from "./focus";

describe("focus rings", () => {
  it("suppresses the UA outline only because it replaces it with a ring", () => {
    // Killing the outline without a replacement is how keyboard users get lost.
    for (const ring of [FOCUS_RING, FOCUS_RING_RAIL]) {
      expect(ring).toContain("focus-visible:outline-none");
      expect(ring).toContain("focus-visible:ring-2");
    }
  });

  it("uses the app ring on app surfaces", () => {
    expect(FOCUS_RING).toContain("focus-visible:ring-focus");
  });

  it("uses the rail ring on the rail, which is dark in both themes", () => {
    // `focus` would vanish against the rail; palette.test.ts enforces the 3:1
    // that makes `focus-rail` visible there.
    expect(FOCUS_RING_RAIL).toContain("focus-visible:ring-focus-rail");
    expect(FOCUS_RING_RAIL).not.toContain("focus-visible:ring-focus ");
  });

  it("fires on keyboard focus only, never on mouse click", () => {
    for (const ring of [FOCUS_RING, FOCUS_RING_RAIL]) {
      expect(ring).not.toMatch(/(^|\s)focus:/);
    }
  });
});
