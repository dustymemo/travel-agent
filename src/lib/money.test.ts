import { describe, it, expect } from "vitest";
import { formatCad } from "./money";

describe("formatCad", () => {
  it("formats a whole-dollar amount in the configured currency", () => {
    const out = formatCad(3840);
    expect(out).toMatch(/\$/);
    expect(out).toContain("3,840");
    // no cents on round demo figures
    expect(out).not.toContain(".00");
  });

  it("handles zero", () => {
    expect(formatCad(0)).toMatch(/\$\s?0/);
  });
});
