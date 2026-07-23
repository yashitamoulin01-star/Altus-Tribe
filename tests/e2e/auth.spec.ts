import { test, expect } from "@playwright/test";

// Role-aware authorization E2E (directive §25/§26).
//
// Split into two groups:
//  1. Credential-free tests — run anywhere, no accounts needed. These cover the
//     directive's key regression + security guarantees (no login toggle; server
//     route protection; unauthenticated denial).
//  2. Authenticated tests — require real test-account credentials supplied via
//     env vars (never hard-code passwords). Skipped automatically when absent.
//
// Run:  npx playwright test
// Auth: set ADMIN_EMAIL/ADMIN_PASSWORD, MEMBER_EMAIL/MEMBER_PASSWORD to enable
//       the authenticated group, e.g.
//       $env:ADMIN_EMAIL="you@x.com"; $env:ADMIN_PASSWORD="…"; npx playwright test

// ---------------------------------------------------------------------------
// 1. Credential-free — the core directive guarantees
// ---------------------------------------------------------------------------
test.describe("authorization — no credentials required", () => {
  test("§18 login has NO 'Log in as administrator' toggle", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).not.toContainText(/log in as admin/i);
    await expect(page.locator('input[name="mode"]')).toHaveCount(0);
    // Login still renders normally.
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("§25-E unauthenticated /admin is denied (→ /login)", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /home is denied (→ /login)", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /onboarding is denied (→ /login)", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// 2. Authenticated — enabled only when test-account creds are provided
// ---------------------------------------------------------------------------
const admin = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const member = { email: process.env.MEMBER_EMAIL, password: process.env.MEMBER_PASSWORD };

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

test.describe("authorization — existing admin (needs ADMIN_* creds)", () => {
  test.skip(!admin.email || !admin.password, "set ADMIN_EMAIL / ADMIN_PASSWORD to run");

  test("§25-A admin logs in, is NOT sent to onboarding, sees Administration + /admin", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await expect(page).not.toHaveURL(/\/onboarding/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator("body")).not.toContainText(/awaiting approval/i);
  });

  test("§25-D admin role persists across refresh", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto("/admin");
    await page.reload();
    await expect(page).toHaveURL(/\/admin/);
  });
});

test.describe("authorization — normal member (needs MEMBER_* creds)", () => {
  test.skip(!member.email || !member.password, "set MEMBER_EMAIL / MEMBER_PASSWORD to run");

  test("§25-B member is denied /admin", async ({ page }) => {
    await login(page, member.email!, member.password!);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});
