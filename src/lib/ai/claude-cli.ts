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
 * Maps our config model ids to CLI-accepted values. The `claude` CLI takes an
 * alias for the latest model ('sonnet', 'opus', 'fable') or a full name
 * ('claude-fable-5'); unknown values pass through so a full id set via
 * TRAVEL_AI_MODEL still works.
 */
const MODEL_ALIASES: Record<string, string> = {
  "claude-sonnet-5": "sonnet",
  "claude-opus-5": "opus",
  "claude-fable-5": "fable",
};

function toCliModel(model: string): string {
  return MODEL_ALIASES[model] ?? model;
}

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
    // Keep CLI args to simple, static flags. The system prompt is large and
    // multiline, so folding it into stdin (below) avoids quoting it through a
    // shell — which the Windows spawn path needs (see spawn.ts).
    const args = ["-p", "--model", toCliModel(opts.model ?? this.model)];

    // Compose the full instruction as stdin: system context first, then the
    // JSON directive, then the user prompt last so it reads as the ask.
    const parts: string[] = [];
    if (opts.system) parts.push(opts.system);
    if (opts.json) parts.push(JSON_INSTRUCTION);
    parts.push(opts.prompt);
    const input = parts.join("\n\n");

    const out = await this.run(args, input, opts.timeoutMs ?? 120_000);
    return out.trim();
  }
}
