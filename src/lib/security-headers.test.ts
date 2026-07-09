import { describe, it, expect } from "vitest";
import { securityHeaders, contentSecurityPolicy } from "@/lib/security-headers";

describe("securityHeaders()", () => {
  it("includes the core hardening headers", () => {
    const map = Object.fromEntries(
      securityHeaders().map((h) => [h.key, h.value]),
    );
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["Permissions-Policy"]).toContain("camera=()");
    expect(map["Content-Security-Policy"]).toBeTruthy();
  });
});

describe("contentSecurityPolicy()", () => {
  it("restricts default-src to self and forbids framing", () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("allows Supabase over https + wss in connect-src", () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("wss://*.supabase.co");
  });

  it("only permits 'unsafe-eval' in development (Turbopack HMR)", () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
  });
});
