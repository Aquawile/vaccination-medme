import { defineConfig } from "vitest/config"

// Unit tests live next to the code in src/. Browser tests in tests/ run with Playwright.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
})
