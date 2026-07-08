import { describe, it, expect } from "vitest";
import { FakeProvider } from "@/lib/ai/fake";

describe("FakeProvider", () => {
  it("is named 'fake'", () => {
    expect(new FakeProvider().name).toBe("fake");
  });

  it("returns a canned string response", async () => {
    const p = new FakeProvider('{"ok":true}');
    expect(await p.generate({ prompt: "anything" })).toBe('{"ok":true}');
  });

  it("can compute the response from the options", async () => {
    const p = new FakeProvider((o) => `echo:${o.prompt}`);
    expect(await p.generate({ prompt: "plan Vancouver" })).toBe(
      "echo:plan Vancouver",
    );
  });
});
