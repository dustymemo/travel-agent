/**
 * The planner brain (TA-18): one conversational turn → a chat reply plus a
 * fully-validated itinerary. Framework-free; runs through the pluggable
 * TravelAIProvider so the UI/API never touch a concrete model.
 */
import type { TravelAIProvider } from "@/lib/ai/provider";
import { PlanTurnOutput, type Message, type Itinerary } from "@/types/trip";
import { buildPlannerRequest } from "./prompt";
import { extractJson } from "./json";

/** Thrown when the model's output can't be parsed/validated into a plan. */
export class PlannerError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PlannerError";
  }
}

/** Total generate() attempts per turn before giving up (2 retries). */
const MAX_ATTEMPTS = 3;

/**
 * Run one planning turn. On the first turn `messages` alone drafts a plan;
 * pass `currentItinerary` on later turns so the model refines it. The result
 * is schema-validated (Zod), so callers get a trustworthy {@link Itinerary}.
 *
 * The real `claude` CLI occasionally emits empty, fenced, or schema-divergent
 * output, so an unusable result is retried before surfacing a
 * {@link PlannerError}.
 */
export async function planTurn(
  provider: TravelAIProvider,
  messages: Message[],
  currentItinerary?: Itinerary,
): Promise<PlanTurnOutput> {
  const { system, prompt } = buildPlannerRequest(messages, currentItinerary);

  let lastError: PlannerError | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await provider.generate({ system, prompt, json: true });
      return validatePlan(raw);
    } catch (err) {
      if (!(err instanceof PlannerError)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

/** Parse + schema-validate one raw model output into a plan. */
function validatePlan(raw: string): PlanTurnOutput {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch (err) {
    throw new PlannerError("The planner returned no usable JSON.", err);
  }

  const result = PlanTurnOutput.safeParse(parsed);
  if (!result.success) {
    throw new PlannerError(
      "The planner's output did not match the itinerary schema.",
      result.error,
    );
  }

  return result.data;
}

export type { PlanTurnOutput, Itinerary };
