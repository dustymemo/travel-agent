import type { GenerateOptions, TravelAIProvider } from "./provider";

/**
 * A deterministic provider for tests and offline dev.
 *
 * Lets us exercise all planner/budget logic without ever calling Claude,
 * so tests are fast and never flaky. Pass a fixed string or a function that
 * derives the response from the request.
 */
export class FakeProvider implements TravelAIProvider {
  readonly name = "fake";

  constructor(
    private readonly canned:
      string | ((opts: GenerateOptions) => string) = "{}",
  ) {}

  async generate(opts: GenerateOptions): Promise<string> {
    return typeof this.canned === "function" ? this.canned(opts) : this.canned;
  }
}
