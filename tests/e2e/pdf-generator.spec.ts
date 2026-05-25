// tests/e2e/pdf-generator.spec.ts
import { test, expect } from "@playwright/test";

test.describe("PDF Generator tool", () => {
  test("loads with default math worksheet", async ({ page }) => {
    await page.goto("/pdf-generator");

    // The worksheet preview should render
    await expect(page.getByText(/Worksheet Generator/i)).toBeVisible();
    // Default subject is Mathematics
    await expect(page.locator("select").first()).toHaveValue(/math|Mathematics/i);
  });

  test("fetches problems from /api/worksheet/preview", async ({ page }) => {
    // Listen for the API call BEFORE navigating
    const apiPromise = page.waitForResponse((res) =>
      res.url().includes("/api/worksheet/preview")
    );
    await page.goto("/pdf-generator");
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  test("changes subject and re-fetches problems", async ({ page }) => {
    await page.goto("/pdf-generator");
    // Wait for initial fetch
    await page.waitForResponse((res) => res.url().includes("/api/worksheet/preview"));

    // Change subject
    const promise = page.waitForResponse((res) => res.url().includes("/api/worksheet/preview"));
    await page.locator("select").first().selectOption({ label: "Reading" });
    await promise;
  });

  test("switching between Sheet 1 / Sheet 2 / Sheet 3 tabs shows different content", async ({ page }) => {
    await page.goto("/pdf-generator");
    await page.waitForResponse((res) => res.url().includes("/api/worksheet/preview"));

    // Default tab should be Sheet 1
    const sheet1Visible = await page.getByText(/Sheet 1/).first().isVisible();
    expect(sheet1Visible).toBe(true);

    // Click Sheet 2 tab
    await page.getByRole("button", { name: /^Sheet 2$/ }).click();
    // Visible content should change (the title should now say Sheet 2)
    await expect(page.getByText(/Sheet 2 of/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("answer key tab shows answers", async ({ page }) => {
    await page.goto("/pdf-generator");
    await page.waitForResponse((res) => res.url().includes("/api/worksheet/preview"));
    await page.getByRole("button", { name: /Answer Key/i }).click();
    await expect(page.getByText(/ANSWER KEY/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Print/Save as PDF button is present", async ({ page }) => {
    await page.goto("/pdf-generator");
    await expect(
      page.getByRole("button", { name: /Print.*PDF|Save as PDF/i })
    ).toBeVisible();
  });
});
