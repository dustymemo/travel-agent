import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Error boundary", () => {
  it("logs the error to the server console for diagnosis", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    render(<ErrorBoundary error={err} reset={() => {}} />);
    expect(spy).toHaveBeenCalledWith(err);
  });

  it("calls reset() when the user clicks Try again", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
