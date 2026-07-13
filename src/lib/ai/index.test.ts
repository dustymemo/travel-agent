import { describe, it, expect } from "vitest";
import { createProvider } from "@/lib/ai";
import { FakeProvider } from "@/lib/ai/fake";
import { ClaudeCliProvider } from "@/lib/ai/claude-cli";
import { CodexCliProvider } from "@/lib/ai/codex-cli";

describe("createProvider", () => {
  it("returns a ClaudeCliProvider for 'claude-cli'", () => {
    expect(createProvider({ provider: "claude-cli" })).toBeInstanceOf(
      ClaudeCliProvider,
    );
  });

  it("returns a CodexCliProvider for 'codex-cli'", () => {
    expect(createProvider({ provider: "codex-cli" })).toBeInstanceOf(
      CodexCliProvider,
    );
  });

  it("returns a FakeProvider for 'fake'", () => {
    expect(createProvider({ provider: "fake" })).toBeInstanceOf(FakeProvider);
  });

  it("throws for 'claude-api' until Phase 2 is implemented", () => {
    expect(() => createProvider({ provider: "claude-api" })).toThrow(
      /phase 2|not implemented/i,
    );
  });

  it("throws on an unknown provider", () => {
    // @ts-expect-error testing invalid input
    expect(() => createProvider({ provider: "nope" })).toThrow();
  });
});
