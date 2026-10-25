import { test, expect } from "@playwright/test";
import pin from "../changelogs.json" with { type: "json" };

for (const theme of ["light", "dark"] as const) {
  test(`changelog content and version navigation in ${theme} theme`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript((value) => localStorage.setItem("chessvault-theme", value), theme);
    await page.goto("changelog/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const release = page.locator("article").filter({ has: page.getByRole("heading", { name: pin.tag, exact: true }) });
    await expect(release).toBeVisible();
    await expect(release.locator(".release-notes")).not.toBeEmpty();
    await expect(release.getByRole("link", { name: "View release on GitHub" })).toHaveAttribute(
      "href",
      `https://github.com/chessvaultdotapp/chessvault/releases/tag/${encodeURIComponent(pin.tag)}`,
    );
    const links = page.getByRole("navigation", { name: "Changelog versions" }).getByRole("link");
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      const version = await link.innerText();
      await link.click();
      expect(decodeURIComponent(new URL(page.url()).hash)).toBe(`#${version}`);
      await expect(
        page.locator("article").filter({ has: page.getByRole("heading", { name: version, exact: true }) }),
      ).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
