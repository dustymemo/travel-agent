import { describe, it, expect, vi } from "vitest";
import { ClaudeCliProvider } from "@/lib/ai/claude-cli";

describe("ClaudeCliProvider", () => {
  it("is named 'claude-cli'", () => {
    expect(new ClaudeCliProvider("claude-sonnet-5", vi.fn()).name).toBe(
      "claude-cli",
    );
  });

  it("invokes the runner with -p and --model", async () => {
    const run = vi.fn().mockResolvedValue("hi");
    const p = new ClaudeCliProvider("sonnet", run);
    await p.generate({ prompt: "Plan Vancouver" });

    const args = run.mock.calls[0][0] as string[];
    expect(args).toContain("-p");
    expect(args).toContain("--model");
  });

  it("keeps args to simple flags only — no --append-system-prompt", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    const p = new ClaudeCliProvider("sonnet", run);
    await p.generate({
      prompt: "p",
      system: "a long\nmultiline system prompt",
    });

    const args = run.mock.calls[0][0] as string[];
    expect(args).not.toContain("--append-system-prompt");
  });

  it("maps the configured full model id to a CLI alias (claude-sonnet-5 -> sonnet)", async () => {
    const run = vi.fn().mockResolvedValue("x");
    const p = new ClaudeCliProvider("claude-sonnet-5", run);
    await p.generate({ prompt: "p" });

    const args = run.mock.calls[0][0] as string[];
    expect(args).toContain("sonnet");
    expect(args).not.toContain("claude-sonnet-5");
  });

  it("passes an unknown model id through unchanged", async () => {
    const run = vi.fn().mockResolvedValue("x");
    const p = new ClaudeCliProvider("claude-opus-4-8", run);
    await p.generate({ prompt: "p" });

    const args = run.mock.calls[0][0] as string[];
    expect(args).toContain("claude-opus-4-8");
  });

  it("lets a per-call model override the default (and aliases it)", async () => {
    const run = vi.fn().mockResolvedValue("x");
    const p = new ClaudeCliProvider("sonnet", run);
    await p.generate({ prompt: "p", model: "claude-sonnet-5" });

    const args = run.mock.calls[0][0] as string[];
    expect(args).toContain("sonnet");
  });

  it("folds the system prompt into stdin, ending with the user prompt", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    const p = new ClaudeCliProvider("sonnet", run);
    await p.generate({ prompt: "Plan Tokyo", system: "be terse" });

    const stdin = run.mock.calls[0][1] as string;
    expect(stdin).toContain("be terse");
    expect(stdin.trimEnd().endsWith("Plan Tokyo")).toBe(true);
  });

  it("folds a JSON instruction into stdin when json is requested", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    const p = new ClaudeCliProvider("sonnet", run);
    await p.generate({ prompt: "p", json: true });

    const stdin = run.mock.calls[0][1] as string;
    expect(stdin.toLowerCase()).toContain("json");
  });

  it("passes just the prompt as stdin when no system/json given, and trims output", async () => {
    const run = vi.fn().mockResolvedValue("  hello  ");
    const p = new ClaudeCliProvider("sonnet", run);
    const out = await p.generate({ prompt: "hi there" });

    expect(run.mock.calls[0][1]).toBe("hi there");
    expect(out).toBe("hello");
  });
});
