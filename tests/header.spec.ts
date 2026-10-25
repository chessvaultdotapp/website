import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`sticky header changes surface on scroll in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("chessvault-theme", value), theme);
    await page.goto("changelog/");
    const header = page.locator("header");
    const background = () => header.evaluate((element) => getComputedStyle(element).backgroundColor);
    const token = (name: string) =>
      page.evaluate((property) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${property})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }, name);
    const checkContrast = async () => {
      const ratios = await header.evaluate((element) => {
        const luminance = (color: string) => {
          const channels = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((value) => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const background = luminance(getComputedStyle(element).backgroundColor);
        return [...element.querySelectorAll("a")].map((link) => {
          const foreground = luminance(getComputedStyle(link).color);
          return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
        });
      });
      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    };
    await expect.poll(background).toBe(await token("--color-background"));
    await checkContrast();
    await page.evaluate(() => scrollTo(0, 600));
    await expect(header).toHaveClass(/scrolled/);
    await expect.poll(background).toBe(await token("--color-surface-elevated"));
    await checkContrast();
    await expect.poll(() => header.evaluate((element) => element.getBoundingClientRect().top)).toBe(0);
    await page.evaluate(() => scrollTo(0, 0));
    await expect(header).not.toHaveClass(/scrolled/);
    await expect.poll(background).toBe(await token("--color-background"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => header.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  });
}
