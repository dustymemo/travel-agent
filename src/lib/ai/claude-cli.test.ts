import { describe, it, expect, vi } from "vitest";
import { ClaudeCliProvider } from "@/lib/ai/claude-cli";

describe("ClaudeCliProvider", () => {
  it("is named 'claude-cli'", () => {
    expect(new ClaudeCliProvider("claude-sonnet-5", vi.fn()).name).toBe(
      "claude-cli",
    );
  });

  it("invokes the runner with -p and the configured model", async () => {
    const run = vi.fn().mockResolvedValue("hi");
    const p = new ClaudeCliProvider("claude-sonnet-5", run);
    await p.generate({ prompt: "Plan Vancouver" });

    const args = run.mock.calls[0][0] as string[];
    expect(args).toContain("-p");
    expect(args).toContain("--model");
    expect(args).toContain("claude-sonnet-5");
  });

  it("passes the prompt to the runner as stdin input and trims output", async () => {
    const run = vi.fn().mockResolvedValue("  hello  ");
    const p = new ClaudeCliProvider("m", run);
    const out = await p.generate({ prompt: "hi there" });

    expect(run.mock.calls[0][1]).toBe("hi there");
    expect(out).toBe("hello");
  });

  it("lets a per-call model override the default", async () => {
    const run = vi.fn().mockResolvedValue("x");
    const p = new ClaudeCliProvider("claude-sonnet-5", run);
    await p.generate({ prompt: "p", model: "claude-opus-4-8" });

    const args = run.mock.calls[0][0] as string[];
    expect(args).toContain("claude-opus-4-8");
    expect(args).not.toContain("claude-sonnet-5");
  });

  it("appends the system prompt and a JSON instruction when json is requested", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    const p = new ClaudeCliProvider("m", run);
    await p.generate({ prompt: "p", system: "be terse", json: true });

    const args = run.mock.calls[0][0] as string[];
    expect(args).toContain("--append-system-prompt");
    expect(args).toContain("be terse");
    expect(args.join(" ").toLowerCase()).toContain("json");
  });
});
