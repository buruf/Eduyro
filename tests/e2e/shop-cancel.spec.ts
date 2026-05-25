// tests/e2e/shop-cancel.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Shop cancel page", () => {
  test("loads with the cancellation message", async ({ page }) => {
    await page.goto("/shop/cancel");
    await expect(page.getByText(/Checkout cancelled|cancelled/i)).toBeVisible();
  });

  test("provides a link back to the shop", async ({ page }) => {
    await page.goto("/shop/cancel");
    const backLink = page.getByRole("link", { name: /Back to shop/i });
    await expect(backLink.first()).toBeVisible();
    await backLink.first().click();
    await page.waitForURL(/\/shop$/);
  });
});
