import { test, expect, type Page } from "@playwright/test";

// Admin smoke + safety E2E. Read-only: logs in as an admin and asserts every
// admin surface renders without error. Auto-skips unless ADMIN_* creds are set:
//   ADMIN_EMAIL / ADMIN_PASSWORD
// Run: npx playwright test tests/e2e/admin.spec.ts

const admin = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
}

test.describe("admin surfaces (needs ADMIN_* creds)", () => {
  test.skip(!admin.email || !admin.password, "set ADMIN_EMAIL / ADMIN_PASSWORD");

  // Collect page errors so a runtime crash fails the test.
  async function gotoOk(page: Page, path: string, expectText: RegExp) {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status(), `${path} HTTP status`).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(expectText, { timeout: 10000 });
    expect(errors, `${path} runtime errors`).toEqual([]);
  }

  test("admin reaches /admin (not bounced)", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("all admin sections render without error", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await gotoOk(page, "/admin", /Quietly well-run/i);
    await gotoOk(page, "/admin/members", /member/i);
    await gotoOk(page, "/admin/members?status=active", /member/i);
    await gotoOk(page, "/admin/inbox", /inbox|Sacred Space/i);
    await gotoOk(page, "/admin/events", /coming up|Events/i);
    await gotoOk(page, "/admin/assets", /Announcements|Asset/i);
    await gotoOk(page, "/admin/taxonomies", /taxonomy|Categories/i);
    await gotoOk(page, "/admin/approvals", /review|awaiting|Approvals/i);
    await gotoOk(page, "/admin/consultants", /consultant/i);
    await gotoOk(page, "/admin/analytics", /glance|Analytics/i);
    await gotoOk(page, "/admin/audit", /audit|activity|log/i);
  });

  test("session persists across reload (no bounce to /login)", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto("/admin");
    await page.reload();
    await expect(page).toHaveURL(/\/admin$/);
  });
});
