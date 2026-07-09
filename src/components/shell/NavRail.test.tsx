import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavRail } from "./NavRail";

const mockPathname = vi.fn<() => string>();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("NavRail", () => {
  it("renders the primary destinations as links", () => {
    mockPathname.mockReturnValue("/");
    render(<NavRail />);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeVisible();
    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Trips" })).toHaveAttribute(
      "href",
      "/trips",
    );
  });

  it("marks the current route with aria-current", () => {
    mockPathname.mockReturnValue("/trips");
    render(<NavRail />);
    expect(screen.getByRole("link", { name: "Trips" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Plan" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
