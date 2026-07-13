import { config } from "@/lib/config";
import type { TravelAIProvider } from "./provider";
import { ClaudeCliProvider } from "./claude-cli";
import { CodexCliProvider } from "./codex-cli";
import { FakeProvider } from "./fake";

export type ProviderName = "claude-cli" | "codex-cli" | "claude-api" | "fake";

export interface CreateProviderOptions {
  provider?: ProviderName;
  model?: string;
}

/**
 * Factory: the ONLY place the app decides which AI backend to use.
 * Swap providers via env (TRAVEL_AI_PROVIDER) with zero downstream changes.
 */
export function createProvider(
  opts: CreateProviderOptions = {},
): TravelAIProvider {
  const provider = opts.provider ?? config.ai.provider;
  const model = opts.model ?? config.ai.model;

  switch (provider) {
    case "claude-cli":
      return new ClaudeCliProvider(model);
    case "codex-cli":
      return new CodexCliProvider(opts.model ?? config.ai.codexModel);
    case "fake":
      return new FakeProvider();
    case "claude-api":
      throw new Error(
        "claude-api provider is not implemented yet (Phase 2). Use claude-cli.",
      );
    default:
      throw new Error(`Unknown AI provider: ${String(provider)}`);
  }
}

export type { TravelAIProvider, GenerateOptions } from "./provider";
