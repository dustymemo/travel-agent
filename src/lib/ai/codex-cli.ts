import type { GenerateOptions, TravelAIProvider } from "./provider";
import { spawnCodex } from "./codex-spawn";

/**
 * Runs the `codex` CLI once and resolves with the agent's final message.
 * Injected so the provider is testable without spawning a real process.
 */
export type CodexRunner = (
  args: string[],
  input: string,
  timeoutMs: number,
) => Promise<string>;

const JSON_INSTRUCTION =
  "Respond with only valid, minified JSON. No prose, no markdown code fences.";

/**
 * Alternate Phase 1 provider (TA-59): shells out to the OpenAI Codex CLI via
 * `codex exec`. Proves the pluggable TravelAIProvider design with a non-Claude
 * brain — select it with TRAVEL_AI_PROVIDER=codex-cli.
 *
 * Runs read-only (the planner never executes commands) and folds the whole
 * instruction into stdin, so CLI args stay static flags — the same shell-safety
 * approach as ClaudeCliProvider (TA-55).
 */
export class CodexCliProvider implements TravelAIProvider {
  readonly name = "codex-cli";

  constructor(
    private readonly model: string,
    private readonly run: CodexRunner = spawnCodex,
  ) {}

  async generate(opts: GenerateOptions): Promise<string> {
    const args = [
      "exec",
      "-s",
      "read-only",
      "--skip-git-repo-check",
      "--ignore-user-config",
      "--ephemeral",
      "--color",
      "never",
    ];

    // Codex uses its own configured default when no model is given; only pass
    // one when explicitly set (config.ai.codexModel / per-call override).
    const model = opts.model ?? this.model;
    if (model) args.push("--model", model);

    const parts: string[] = [];
    if (opts.system) parts.push(opts.system);
    if (opts.json) parts.push(JSON_INSTRUCTION);
    parts.push(opts.prompt);
    const input = parts.join("\n\n");

    const out = await this.run(args, input, opts.timeoutMs ?? 120_000);
    return out.trim();
  }
}
