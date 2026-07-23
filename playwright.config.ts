import { defineConfig, devices } from "@playwright/test";

// Auth/authorization E2E. Defaults to a local dev server; override with
// PLAYWRIGHT_BASE_URL to run against the deployed app.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3210";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Boot the app for the run unless we're targeting a remote URL.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- -p 3210",
        url: "http://localhost:3210/login",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
