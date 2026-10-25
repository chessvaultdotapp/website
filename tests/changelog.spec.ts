import { test, expect } from "@playwright/test";
import pin from "../changelogs.json" with { type: "json" };

for (const theme of ["light", "dark"] as const) {
  test(`changelog content and collapsed previews in ${theme} theme`, async ({ page }) => {
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
    await expect(release.locator(".release-heading .badge")).toHaveText("♟︎Preview");
    const stable = page.locator("article").filter({ has: page.getByRole("heading", { name: "v0.1.0", exact: true }) });
    await expect(stable.locator(".release-heading .badge")).toHaveText("♛︎Stable");
    await expect(release.getByRole("link", { name: "View release on GitHub" })).toHaveAttribute(
      "href",
      `https://github.com/chessvaultdotapp/chessvault/releases/tag/${encodeURIComponent(pin.tag)}`,
    );
    await expect(page.getByRole("navigation", { name: "Changelog versions" })).toHaveCount(0);
    const previewNotes = page.locator("#historical-previews");
    await expect(previewNotes).not.toHaveAttribute("open");
    await expect(previewNotes.locator("article")).toHaveCount(7);
    await expect(page.getByRole("heading", { name: "v0.1.0+26w43a", exact: true })).toBeVisible();
    await previewNotes.getByText("Development previews (7)", { exact: true }).click();
    await expect(previewNotes).toHaveAttribute("open", "");
    await previewNotes.getByText("Development previews (7)", { exact: true }).click();
    await page.evaluate(() => {
      location.hash = "v0.0.0+26w40a";
    });
    await expect(page.getByRole("heading", { name: "v0.0.0+26w40a", exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(previewNotes).toHaveAttribute("open", "");
    await page.reload();
    await expect(previewNotes).toHaveAttribute("open", "");
    await previewNotes.getByText("Development previews (7)", { exact: true }).click();
    await expect(previewNotes).not.toHaveAttribute("open");
    await previewNotes.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(previewNotes).toHaveAttribute("open", "");
    expect(errors).toEqual([]);
  });
}
