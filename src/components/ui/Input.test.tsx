import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, inputClasses } from "./Input";

describe("inputClasses", () => {
  it("sits on the field surface so it flips with the theme", () => {
    // Regression guard: these were hardcoded `bg-white` before TA-26 and broke
    // in dark mode. A literal colour here must never come back.
    expect(inputClasses()).toContain("bg-field");
    expect(inputClasses()).not.toContain("bg-white");
  });

  it("always ships a visible focus ring", () => {
    for (const variant of ["field", "pill"] as const) {
      expect(inputClasses(variant)).toContain("focus-visible:ring-2");
      expect(inputClasses(variant)).toContain("focus-visible:ring-focus");
    }
  });

  it("rounds a pill fully and a field softly", () => {
    expect(inputClasses("pill")).toContain("rounded-full");
    expect(inputClasses("field")).toContain("rounded-lg");
  });

  it("defaults to field", () => {
    expect(inputClasses()).toBe(inputClasses("field"));
  });
});

describe("Input", () => {
  it("renders a real input the label can address", () => {
    render(
      <>
        <label htmlFor="when">Trip start</label>
        <Input id="when" type="date" />
      </>,
    );
    expect(screen.getByLabelText("Trip start")).toBeVisible();
  });

  it("forwards typing to onChange", async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Message" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Message"), "hi");
    expect(onChange).toHaveBeenCalled();
  });

  it("keeps placeholder text muted rather than invisible", () => {
    render(<Input aria-label="Message" placeholder="Message Roam…" />);
    expect(screen.getByPlaceholderText("Message Roam…")).toHaveClass(
      "placeholder:text-ink-soft",
    );
  });

  it("merges caller classes", () => {
    render(<Input aria-label="Message" className="flex-1" />);
    expect(screen.getByLabelText("Message")).toHaveClass("flex-1");
  });
});
