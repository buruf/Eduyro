// tests/e2e/shop-browsing.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Shop browsing", () => {
  test("loads with 4 skill cards", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByText(/Addition/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Subtraction/i).first()).toBeVisible();
    await expect(page.getByText(/Multiplication/i).first()).toBeVisible();
    await expect(page.getByText(/Division/i).first()).toBeVisible();
  });

  test("clicking a skill card selects it and shows $3.99", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForResponse((res) => res.url().includes("/api/shop/catalog"));
    // Wait a moment for the cards to render after catalog loads
    await page.waitForTimeout(500);
    // Click directly on the Addition text — it sits inside a clickable card
    await page.getByText("Addition", { exact: false }).first().click();
    await expect(page.getByText(/\$3\.99/).first()).toBeVisible({ timeout: 5000 });
  });

  test("selecting 2 skills shows $5.99", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForResponse((res) => res.url().includes("/api/shop/catalog"));
    await page.waitForTimeout(500);
    await page.getByText("Addition", { exact: false }).first().click();
    await page.getByText("Subtraction", { exact: false }).first().click();
    await expect(page.getByText(/\$5\.99/).first()).toBeVisible({ timeout: 5000 });
  });

  test("selecting all 4 skills shows $9.99", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForResponse((res) => res.url().includes("/api/shop/catalog"));
    await page.waitForTimeout(500);
    for (const name of ["Addition", "Subtraction", "Multiplication", "Division"]) {
      await page.getByText(name, { exact: false }).first().click();
    }
    await expect(page.getByText(/\$9\.99/).first()).toBeVisible({ timeout: 5000 });
  });

  test("Pay button requires email", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForResponse((res) => res.url().includes("/api/shop/catalog"));
    await page.waitForTimeout(500);
    await page.getByText("Addition", { exact: false }).first().click();
    await page.getByRole("button", { name: /Pay.*\$3\.99/i }).click();
    await expect(page.getByText(/valid email|enter a valid email/i)).toBeVisible({ timeout: 3000 });
  });

  test("FAQ section is present", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByText(/Common questions/i)).toBeVisible();
    // Click a FAQ to expand
    await page.getByText(/What's included in each pack/i).click();
    // Use .first() because "100 worksheets per skill" appears in two places (hero + FAQ)
    await expect(page.getByText(/100 worksheets per skill/i).first()).toBeVisible();
  });

  test("preview sample link calls the sample API", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForResponse((res) => res.url().includes("/api/shop/catalog"));
    const samplePromise = page.waitForResponse((res) => res.url().includes("/api/shop/sample"));
    const previewLink = page.getByText(/Preview free sample/i).first();
    await expect(previewLink).toBeVisible({ timeout: 5000 });
    await page.evaluate(() => {
      (window as any).__originalOpen = window.open;
      window.open = () => null;
    });
    await previewLink.click();
    const sampleResponse = await samplePromise;
    expect(sampleResponse.status()).toBe(200);
  });
});
