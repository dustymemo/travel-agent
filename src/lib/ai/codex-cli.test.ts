import { describe, it, expect, vi } from "vitest";
import { CodexCliProvider } from "@/lib/ai/codex-cli";

describe("CodexCliProvider", () => {
  it("is named 'codex-cli'", () => {
    expect(new CodexCliProvider("", vi.fn()).name).toBe("codex-cli");
  });

  it("runs `codex exec` read-only", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    await new CodexCliProvider("", run).generate({ prompt: "Plan Tokyo" });

    const args = run.mock.calls[0][0] as string[];
    expect(args[0]).toBe("exec");
    expect(args).toContain("-s");
    expect(args).toContain("read-only");
  });

  it("keeps args to static flags — untrusted text goes to stdin", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    await new CodexCliProvider("", run).generate({
      prompt: "p",
      system: "a long\nmultiline system prompt",
    });
    const args = run.mock.calls[0][0] as string[];
    expect(args.some((a) => a.includes("multiline"))).toBe(false);
  });

  it("omits --model when none is configured (uses Codex default)", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    await new CodexCliProvider("", run).generate({ prompt: "p" });
    expect(run.mock.calls[0][0]).not.toContain("--model");
  });

  it("passes --model when configured, and lets a per-call model override it", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    const p = new CodexCliProvider("gpt-5-codex", run);
    await p.generate({ prompt: "p" });
    expect(run.mock.calls[0][0]).toContain("gpt-5-codex");

    await p.generate({ prompt: "p", model: "o4-mini" });
    const args = run.mock.calls[1][0] as string[];
    expect(args).toContain("o4-mini");
    expect(args).not.toContain("gpt-5-codex");
  });

  it("folds system + JSON directive + prompt into stdin, ending with the prompt", async () => {
    const run = vi.fn().mockResolvedValue("{}");
    await new CodexCliProvider("", run).generate({
      prompt: "Plan Kyoto",
      system: "be terse",
      json: true,
    });
    const stdin = run.mock.calls[0][1] as string;
    expect(stdin).toContain("be terse");
    expect(stdin.toLowerCase()).toContain("json");
    expect(stdin.trimEnd().endsWith("Plan Kyoto")).toBe(true);
  });

  it("passes just the prompt when no system/json, and trims output", async () => {
    const run = vi.fn().mockResolvedValue("  hi  ");
    const out = await new CodexCliProvider("", run).generate({ prompt: "yo" });
    expect(run.mock.calls[0][1]).toBe("yo");
    expect(out).toBe("hi");
  });
});
