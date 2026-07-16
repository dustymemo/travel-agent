import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonClasses } from "./Button";

describe("buttonClasses", () => {
  it("carries the accent surface for the primary action", () => {
    expect(buttonClasses("primary")).toContain("bg-terracotta");
    expect(buttonClasses("primary")).toContain("text-surface");
  });

  it("keeps the secondary action quiet — outlined, not filled", () => {
    expect(buttonClasses("secondary")).toContain("border-line");
    expect(buttonClasses("secondary")).not.toContain("bg-terracotta");
  });

  it("always ships a visible focus ring — every variant, no exceptions", () => {
    for (const variant of ["primary", "secondary"] as const) {
      expect(buttonClasses(variant)).toContain("focus-visible:ring-2");
      expect(buttonClasses(variant)).toContain("focus-visible:ring-focus");
    }
  });

  it("defaults to primary", () => {
    expect(buttonClasses()).toBe(buttonClasses("primary"));
  });
});

describe("Button", () => {
  it("renders a real <button> that defaults to type=button", () => {
    render(<Button>Try again</Button>);
    const button = screen.getByRole("button", { name: "Try again" });
    // Defaulting matters: an unspecified type submits any enclosing form.
    expect(button).toHaveAttribute("type", "button");
  });

  it("lets the caller override the type (e.g. a submit button)", () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Retry</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Retry
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("merges caller classes, letting them win over the variant", () => {
    render(<Button className="mt-2">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("mt-2");
  });

  it("forwards arbitrary button props (aria-label and friends)", () => {
    render(<Button aria-label="Send message">↑</Button>);
    expect(screen.getByRole("button", { name: "Send message" })).toBeVisible();
  });
});
