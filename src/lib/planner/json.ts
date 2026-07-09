/**
 * Best-effort JSON extraction from a model's raw text output.
 *
 * Even in JSON mode a model may wrap its answer in ```json fences or add a
 * stray sentence. We strip fences, then fall back to slicing the outermost
 * `{ … }`. Throws if nothing parseable is found — the caller maps that to a
 * planner error and can retry.
 */
export function extractJson(raw: string): unknown {
  const text = stripFences(raw).trim();

  try {
    return JSON.parse(text);
  } catch {
    // fall through to brace-slicing
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // fall through to throw
    }
  }

  throw new Error("Model output did not contain valid JSON");
}

/** Return the contents of the first fenced code block, or the input unchanged. */
function stripFences(s: string): string {
  const match = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1] : s;
}
