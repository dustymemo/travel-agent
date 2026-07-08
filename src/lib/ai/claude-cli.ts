import type { GenerateOptions, TravelAIProvider } from "./provider";
import { spawnClaude } from "./spawn";

/**
 * Runs the `claude` CLI once and resolves with its stdout.
 * Injected so the provider is testable without spawning a real process.
 */
export type ClaudeRunner = (
  args: string[],
  input: string,
  timeoutMs: number,
) => Promise<string>;

const JSON_INSTRUCTION =
  "Respond with only valid, minified JSON. No prose, no markdown code fences.";

/**
 * Phase 1 AI provider: shells out to the local `claude` CLI, which runs on
 * the user's Gmail-linked subscription (no API key). In Docker it authenticates
 * via a long-lived token from `claude setup-token` (CLAUDE_CODE_OAUTH_TOKEN).
 */
export class ClaudeCliProvider implements TravelAIProvider {
  readonly name = "claude-cli";

  constructor(
    private readonly model: string,
    private readonly run: ClaudeRunner = spawnClaude,
  ) {}

  async generate(opts: GenerateOptions): Promise<string> {
    const args = ["-p", "--model", opts.model ?? this.model];

    const systemParts: string[] = [];
    if (opts.system) systemParts.push(opts.system);
    if (opts.json) systemParts.push(JSON_INSTRUCTION);
    for (const part of systemParts) {
      args.push("--append-system-prompt", part);
    }

    const out = await this.run(args, opts.prompt, opts.timeoutMs ?? 120_000);
    return out.trim();
  }
}
