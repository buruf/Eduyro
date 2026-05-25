// tests/e2e/placement-test.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Public placement test", () => {
  test("loads the placement test landing page", async ({ page }) => {
    await page.goto("/placement");
    // Page should load with some heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("navigates from homepage CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /placement test/i }).first().click();
    await page.waitForURL(/\/placement/);
  });

  test("page renders body content (not blank)", async ({ page }) => {
    await page.goto("/placement");
    // Wait for actual content, not a redirect. Any visible text on the page.
    const bodyText = await page.locator("body").textContent();
    expect(bodyText && bodyText.length > 100).toBe(true);
  });
});
