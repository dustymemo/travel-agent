import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // Standalone output → small self-contained server for the Docker image.
  output: "standalone",
  // Baseline security headers on every route (TA-49).
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;
