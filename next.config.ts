import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output → small self-contained server for the Docker image.
  output: "standalone",
};

export default nextConfig;
