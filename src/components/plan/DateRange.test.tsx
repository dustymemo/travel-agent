import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRange } from "./DateRange";

beforeEach(() => vi.clearAllMocks());

describe("DateRange", () => {
  it("emits a validated range once both dates are set", async () => {
    const onChange = vi.fn();
    render(<DateRange onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Trip start"), "2026-09-09");
    await userEvent.type(screen.getByLabelText("Trip end"), "2026-09-15");

    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-09-09",
      end: "2026-09-15",
    });
  });

  it("emits null and warns when end is before start", async () => {
    const onChange = vi.fn();
    render(<DateRange onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Trip start"), "2026-09-15");
    await userEvent.type(screen.getByLabelText("Trip end"), "2026-09-09");

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("alert")).toHaveTextContent(/on or after/i);
  });
});
