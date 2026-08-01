import { test, expect } from "@playwright/test";

test.describe("Mobile navigation menu", () => {
  test("hamburger opens the sheet with all links and navigates on tap", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Desktop nav is hidden on mobile; hamburger is visible
    const menuButton = page.getByRole("button", { name: "Toggle menu" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Sheet appears with core links — scoped to the sheet element so the footer's
    // exact-name links (visible on every page) can never collide
    const sheet = page.getByTestId("mobile-menu");
    const sheetLink = (name: string) =>
      sheet.getByRole("link", { name, exact: true });
    await expect(sheetLink("Vaults")).toBeVisible();
    await expect(sheetLink("Quests")).toBeVisible();
    await expect(sheetLink("Points")).toBeVisible();
    await expect(sheetLink("Referrals")).toBeVisible();
    await expect(sheetLink("History")).toBeVisible();

    // Tapping a link navigates and closes the sheet
    await sheetLink("Quests").click();
    await page.waitForURL("**/quests");
    await expect(page.getByRole("heading", { name: /quests/i }).first()).toBeVisible();
  });

  test("hamburger toggles closed and open", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Toggle menu" });
    await menuButton.click();
    const sheetVault = page.getByTestId("mobile-menu").getByRole("link", {
      name: "Vaults",
      exact: true,
    });
    await expect(sheetVault).toBeVisible();
    await menuButton.click();
    await expect(sheetVault).toBeHidden();
  });
});
