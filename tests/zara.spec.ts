import { test, expect, Page, Locator } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });
test("", async ({ page }) => {
    await page.goto("https://www.zara.com/es/en/");
    await page.locator("#onetrust-accept-btn-handler").click();
    await expect(page.locator("#onetrust-banner-sdk")).not.toBeVisible();
    let cookies = await page.context().cookies();
    expect(cookies.length).toBeGreaterThan(0);
    const updatedCookies = cookies.map((cookie) => {
        const isTarget =
            cookie.name === "cart-was-updated-in-standard" &&
            cookie.domain === ".zara.com" &&
            cookie.path === "/";

        if (isTarget) {
            return { ...cookie, value: "changed" };
        }

        return cookie;
    });
    await page.context().clearCookies();
    await page.context().addCookies(updatedCookies);

    cookies = await page.context().cookies();
    const cookie = cookies.find(
        (item) =>
            item.name === "cart-was-updated-in-standard" &&
            item.domain === ".zara.com" &&
            item.path === "/",
    );

    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe("changed");
});
