/**
 * Pluggable AI provider interface.
 *
 * The rest of the app depends ONLY on this interface, never on a concrete
 * provider. Today we run Claude via the local `claude` CLI (no API key,
 * uses the user's subscription). For a public deploy, swap in claude-api
 * by setting TRAVEL_AI_PROVIDER=claude-api — no other code changes.
 */

export interface GenerateOptions {
  /** System/instruction prompt. */
  system?: string;
  /** User prompt. */
  prompt: string;
  /** If true, provider must return strictly-parseable JSON. */
  json?: boolean;
  /** Override the configured model. */
  model?: string;
  /** Abort after this many ms. */
  timeoutMs?: number;
}

export interface TravelAIProvider {
  readonly name: string;
  /** Returns the model's raw text output. */
  generate(opts: GenerateOptions): Promise<string>;
}
