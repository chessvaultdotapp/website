import { test, expect } from "@playwright/test";

test("documentation sidebar stays below the sticky header", async ({ page }) => {
  await page.goto("docs/getting-started/");
  const sidebar = page.getByRole("complementary", { name: "Documentation navigation" });
  const header = page.locator("header");
  await page.evaluate(() => scrollTo(0, 500));
  if (await sidebar.evaluate((element) => getComputedStyle(element).position === "sticky")) {
    await expect
      .poll(async () => {
        const sidebarBox = await sidebar.boundingBox();
        const headerBox = await header.boundingBox();
        return sidebarBox!.y - (headerBox!.y + headerBox!.height);
      })
      .toBeGreaterThanOrEqual(15);
    await expect
      .poll(() =>
        sidebar.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.bottom <= innerHeight;
        }),
      )
      .toBe(true);
  } else {
    // Mobile navigation remains in normal flow, rather than consuming sticky space.
    await expect(sidebar).toHaveCSS("position", "static");
  }
});
