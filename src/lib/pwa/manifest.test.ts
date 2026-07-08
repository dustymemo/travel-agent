import { describe, it, expect } from "vitest";
import { manifest } from "@/lib/pwa/manifest";

describe("pwa manifest", () => {
  it("names the app", () => {
    expect(manifest.name).toMatch(/travel/i);
    expect(manifest.short_name).toBeTruthy();
  });

  it("is installable as a standalone app launched from the root", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
  });

  it("declares an installable icon (svg or 512px)", () => {
    const icons = manifest.icons ?? [];
    const ok = icons.some(
      (i) => i.type === "image/svg+xml" || (i.sizes ?? "").includes("512"),
    );
    expect(ok).toBe(true);
  });

  it("provides a maskable icon for Android adaptive icons", () => {
    const icons = manifest.icons ?? [];
    expect(icons.some((i) => (i.purpose ?? "").includes("maskable"))).toBe(
      true,
    );
  });

  it("sets theme and background colors", () => {
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });
});
