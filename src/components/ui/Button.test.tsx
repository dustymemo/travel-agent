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

  it("normalises the disabled treatment across every variant", () => {
    // Was opacity-60 in one file and opacity-50 in two others before TA-60.
    for (const variant of ["primary", "secondary"] as const) {
      expect(buttonClasses(variant)).toContain("disabled:opacity-60");
    }
  });

  it("stops a disabled button reacting to the pointer", () => {
    // Verified in a browser: :hover still matches a disabled <button>, so
    // without this the disabled send button repainted terracotta ->
    // terracotta-deep and looked clickable.
    for (const variant of ["primary", "secondary"] as const) {
      expect(buttonClasses(variant)).toContain("disabled:pointer-events-none");
    }
  });

  it("sizes the call sites the app actually has", () => {
    expect(buttonClasses("primary", "md")).toContain("h-11");
    expect(buttonClasses("primary", "sm")).toContain("py-2");
    expect(buttonClasses("secondary", "xs")).toContain("text-xs");
    // The chat send button is a circular icon target.
    expect(buttonClasses("primary", "icon")).toContain("w-10");
  });

  it("defaults to the md size", () => {
    expect(buttonClasses("primary")).toBe(buttonClasses("primary", "md"));
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
