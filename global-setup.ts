import { mkdir } from "node:fs/promises";
import { chromium, expect, type FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
    const { baseURL, storageState } = config.projects[0].use;
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!baseURL || typeof storageState !== "string") {
        throw new Error(
            "Потрібні baseURL і шлях до storageState у конфігурації",
        );
    }

    if (!email || !password) {
        throw new Error("Задай TEST_USER_EMAIL і TEST_USER_PASSWORD");
    }

    await mkdir("playwright/.auth", { recursive: true });
    const browser = await chromium.launch();

    try {
        const context = await browser.newContext({ baseURL });
        const page = await context.newPage();

        await page.goto("/login");
        await page.getByTestId("auth-email").fill(email);
        await page.getByTestId("auth-password").fill(password);
        await page.getByTestId("auth-submit").click();

        await expect
            .poll(() =>
                page.evaluate(() => localStorage.getItem("qa-dojo.token")),
            )
            .toBeTruthy();

        await context.storageState({ path: storageState });
    } finally {
        await browser.close();
    }
}
