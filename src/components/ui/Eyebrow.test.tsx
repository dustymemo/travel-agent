import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Eyebrow } from "./Eyebrow";

describe("Eyebrow", () => {
  it("renders a span by default", () => {
    render(<Eyebrow>Your itinerary</Eyebrow>);
    expect(screen.getByText("Your itinerary").tagName).toBe("SPAN");
  });

  // The kicker above a fact list is a real heading; styling it must not cost
  // screen-reader users the document outline.
  it("renders the element it is asked for, keeping heading semantics", () => {
    render(<Eyebrow as="h3">Pack</Eyebrow>);
    expect(
      screen.getByRole("heading", { level: 3, name: "Pack" }),
    ).toBeVisible();
  });

  it("applies the shared kicker treatment", () => {
    render(<Eyebrow>Typical</Eyebrow>);
    const el = screen.getByText("Typical");
    expect(el).toHaveClass(
      "font-mono",
      "text-xs",
      "uppercase",
      "text-ink-soft",
    );
  });

  it("merges caller classes", () => {
    render(<Eyebrow className="mt-4">Apps</Eyebrow>);
    expect(screen.getByText("Apps")).toHaveClass("mt-4");
  });

  it("forwards props to the rendered element", () => {
    render(<Eyebrow aria-label="section label">Tips</Eyebrow>);
    expect(screen.getByLabelText("section label")).toBeVisible();
  });
});
