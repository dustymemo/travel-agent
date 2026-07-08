import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      // Exclude thin I/O glue that's exercised via integration/e2e, not units.
      exclude: ["src/lib/ai/spawn.ts", "src/lib/supabase/**"],
      // The brain is pure logic — hold it to a high bar.
      thresholds: { lines: 90, functions: 90, branches: 80, statements: 90 },
    },
  },
});
