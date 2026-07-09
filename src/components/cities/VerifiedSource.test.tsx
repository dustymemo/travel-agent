import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerifiedSource } from "./VerifiedSource";

describe("VerifiedSource", () => {
  const props = {
    source: "https://www.translink.ca/transit-fares/compass-card",
    lastVerified: "2026-07-08",
  };

  it("links to the cited source and opens it safely in a new tab", () => {
    render(<VerifiedSource {...props} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", props.source);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toMatch(/noopener/);
  });

  it("shows a human-readable verification date", () => {
    render(<VerifiedSource {...props} />);
    // Deterministic regardless of the runner's timezone (formatted in UTC).
    expect(screen.getByText(/Jul 8, 2026/)).toBeInTheDocument();
  });

  it("names the source host in an accessible label", () => {
    render(<VerifiedSource {...props} />);
    const link = screen.getByRole("link");
    const label = link.getAttribute("aria-label") ?? "";
    expect(label).toMatch(/translink\.ca/);
    expect(label).toMatch(/verified/i);
  });

  it("marks its icon as decorative for screen readers", () => {
    const { container } = render(<VerifiedSource {...props} />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("merges caller className onto the link", () => {
    render(<VerifiedSource {...props} className="mt-2" />);
    expect(screen.getByRole("link")).toHaveClass("mt-2");
  });
});
