import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, cardClasses } from "./Card";

describe("cardClasses", () => {
  it("gives a solid card a surface and a hairline", () => {
    expect(cardClasses()).toContain("bg-surface");
    expect(cardClasses()).toContain("border-line");
  });

  it("makes an interactive card respond to hover and focus", () => {
    // Used by <Link> trip cards, so it must carry its own focus ring.
    expect(cardClasses("interactive")).toContain("hover:bg-surface-2");
    expect(cardClasses("interactive")).toContain("focus-visible:ring-focus");
  });

  it("draws an empty-state card as a dashed outline with no fill", () => {
    expect(cardClasses("empty")).toContain("border-dashed");
    expect(cardClasses("empty")).not.toContain("bg-surface");
  });

  it("defaults to solid", () => {
    expect(cardClasses()).toBe(cardClasses("solid"));
  });
});

describe("Card", () => {
  it("renders a div by default", () => {
    render(<Card>body</Card>);
    expect(screen.getByText("body").tagName).toBe("DIV");
  });

  // The itinerary panel is an <article>, the weather strip a <section> — the
  // wrapper must not flatten either into a div.
  it("renders the semantic element it is asked for", () => {
    const { container } = render(<Card as="article">itinerary</Card>);
    expect(container.querySelector("article")).not.toBeNull();
  });

  it("merges caller classes, letting them win", () => {
    render(<Card className="p-10">roomy</Card>);
    expect(screen.getByText("roomy")).toHaveClass("p-10");
  });

  it("forwards props to the rendered element", () => {
    render(<Card aria-label="Itinerary">x</Card>);
    expect(screen.getByLabelText("Itinerary")).toBeVisible();
  });
});
