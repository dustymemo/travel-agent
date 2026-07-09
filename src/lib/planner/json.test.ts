import { describe, it, expect } from "vitest";
import { extractJson } from "./json";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips a ```json fenced block", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("strips an unlabelled ``` fence", () => {
    expect(extractJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("recovers JSON embedded in prose", () => {
    expect(extractJson('Sure! Here you go: {"a":1} — enjoy.')).toEqual({
      a: 1,
    });
  });

  it("throws when there is no JSON", () => {
    expect(() => extractJson("not json at all")).toThrow();
  });
});
