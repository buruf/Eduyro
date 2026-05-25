// tests/e2e/homepage.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with hero, navigation, and key CTAs", async ({ page }) => {
    await page.goto("/");

    // Hero present
    await expect(page.locator("h1").first()).toBeVisible();

    // Navbar links that actually exist on the homepage
    await expect(page.getByRole("link", { name: /How it works/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /For schools/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Pricing/i }).first()).toBeVisible();

    // Primary CTA — "Free placement test" or similar
    await expect(page.getByRole("link", { name: /placement test/i }).first()).toBeVisible();
  });

  test("'For schools' link navigates to /schools", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /For schools/i }).first().click();
    await page.waitForURL(/\/schools/);
  });

  test("placement test CTA goes to /placement", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /placement test/i }).first().click();
    await page.waitForURL(/\/placement/);
  });

  test("page is responsive (no horizontal scrollbar on standard viewport)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});
