import { test, expect, type Page } from "@playwright/test";

// Phase U member-journey + security E2E (U22). Most scenarios need real accounts,
// so they auto-skip unless creds are provided (never hard-code passwords):
//   MEMBER_EMAIL / MEMBER_PASSWORD            — a complete member
//   INCOMPLETE_EMAIL / INCOMPLETE_PASSWORD    — a member mid-portfolio
//   OTHER_SLUG                                — another member's /m/<slug> to view
// Run: npx playwright test tests/e2e/member.spec.ts

const member = { email: process.env.MEMBER_EMAIL, password: process.env.MEMBER_PASSWORD };
const incomplete = { email: process.env.INCOMPLETE_EMAIL, password: process.env.INCOMPLETE_PASSWORD };
const otherSlug = process.env.OTHER_SLUG;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

test.describe("member journey (needs MEMBER_* creds)", () => {
  test.skip(!member.email || !member.password, "set MEMBER_EMAIL / MEMBER_PASSWORD");

  test("U22 complete member lands in app, NOT portfolio", async ({ page }) => {
    await login(page, member.email!, member.password!);
    await expect(page).not.toHaveURL(/\/onboarding/);
  });

  test("U22 directory renders + search works", async ({ page }) => {
    await login(page, member.email!, member.password!);
    await page.goto("/explore");
    await expect(page.locator('input[type="search"]')).toBeVisible();
    await page.fill('input[type="search"]', "zzzznomatch");
    await expect(page.locator("body")).toContainText(/no one matches/i);
  });

  test("U21 member is denied /admin (server-side)", async ({ page }) => {
    await login(page, member.email!, member.password!);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("U13 own-profile edit persists across refresh", async ({ page }) => {
    await login(page, member.email!, member.password!);
    await page.goto("/account/edit");
    const bio = page.locator("textarea").first();
    if (await bio.count()) {
      const stamp = `Verified ${Date.now()}`;
      await bio.fill(stamp);
      // Trigger save (blur/autosave or explicit Save button if present).
      const save = page.getByRole("button", { name: /save/i });
      if (await save.count()) await save.first().click();
      await page.waitForTimeout(1500);
      await page.reload();
      await expect(page.locator("textarea").first()).toHaveValue(stamp);
    }
  });
});

test.describe("incomplete member (needs INCOMPLETE_* creds)", () => {
  test.skip(!incomplete.email || !incomplete.password, "set INCOMPLETE_EMAIL / INCOMPLETE_PASSWORD");

  test("U22 incomplete member resumes Portfolio Creation", async ({ page }) => {
    await login(page, incomplete.email!, incomplete.password!);
    await expect(page).toHaveURL(/\/onboarding/);
  });
});

test.describe("privacy — A1–A22 never leaks (needs MEMBER_* + OTHER_SLUG)", () => {
  test.skip(
    !member.email || !member.password || !otherSlug,
    "set MEMBER_* and OTHER_SLUG to run the leak test",
  );

  test("U12/U14 another member's profile has no admin CRM data", async ({ page }) => {
    await login(page, member.email!, member.password!);
    const res = await page.goto(`/m/${otherSlug}`);
    // The full HTML/JSON payload must not contain any admin-only CRM markers.
    const body = (await res?.text()) ?? "";
    for (const leak of ["participant_admin", "participant_assets", "breakthrough", "upsell", "referred_by", "designated_consultant"]) {
      expect(body.toLowerCase()).not.toContain(leak);
    }
  });
});
