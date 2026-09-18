import { test, expect, Page } from "@playwright/test";

const uniqueUser = () =>
    `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const uniqueEmail = (userName: string) => `${userName}@example.com`;

async function registerUser(
    page: Page,
    username: string,
    email: string,
    password: string = "ValidPassword123!",
) {
    await page.goto("/register");
    await page.getByTestId("auth-username").fill(username);
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("register-confirm-password").fill(password);
    await page.getByTestId("register-terms").check();
    await page.getByTestId("auth-submit").click();
}

async function signInUser(
    page: Page,
    email: string,
    password: string = "ValidPassword123!",
) {
    await page.goto("/login");
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-submit").click();
}

test.describe("Registration", { tag: "@auth" }, () => {
    test("Registration with unique credentials", async ({ page }) => {
        const userName = uniqueUser();
        const email = uniqueEmail(userName);

        await registerUser(page, userName, email);
        await page.waitForURL("/articles");
        await expect(
            page.getByRole("link", { name: "Sign in" }),
        ).not.toBeVisible();
        await expect(
            page.getByRole("link", { name: "Register" }),
        ).not.toBeVisible();
        await expect(page.getByText(`${userName}`)).toBeVisible();
    });

    test("Registration with used email", async ({ browser }) => {
        const userName = uniqueUser();
        const email = uniqueEmail(userName);

        const prepContext = await browser.newContext();
        const prepPage = await prepContext.newPage();
        await registerUser(prepPage, userName, email);

        const regContext = await browser.newContext();
        const regPage = await regContext.newPage();
        await registerUser(regPage, userName, email);

        await expect(
            regPage.getByText("body email або username вже зайняті"),
        ).toBeVisible();
    });

    test("Registration with empty data", async ({ page }) => {
        await page.goto("/register");
        await page.getByTestId("register-terms").check();
        await page.getByTestId("auth-submit").click();

        await expect(
            page.getByText("username ім'я має містити щонайменше 3 символи"),
        ).toBeVisible();
        await expect(page.getByText("email некоректний email")).toBeVisible();
        await expect(
            page.getByText("password пароль має містити щонайменше 6 символів"),
        ).toBeVisible();
    });
});

test.describe("Login", { tag: "@auth" }, () => {
    test("Login with valid credentials", async ({ browser }) => {
        const userName = uniqueUser();
        const email = uniqueEmail(userName);

        const prepContext = await browser.newContext();
        const prepPage = await prepContext.newPage();
        await registerUser(prepPage, userName, email);

        const regContext = await browser.newContext();
        const regPage = await regContext.newPage();
        await signInUser(regPage, email);

        await expect(regPage.getByText(`${userName}`)).toBeVisible();
    });

    test("Login with invalid password", async ({ browser }) => {
        const userName = uniqueUser();
        const email = uniqueEmail(userName);
        const password = "InvalidPassword123!";

        const prepContext = await browser.newContext();
        const prepPage = await prepContext.newPage();
        await registerUser(prepPage, userName, email);

        const regContext = await browser.newContext();
        const regPage = await regContext.newPage();
        await signInUser(regPage, email, password);

        await expect(
            regPage.getByText("email or password неправильні"),
        ).toBeVisible();
    });

    test("Login with unregistered email", async ({ page }) => {
        const userName = "unregisteredUser";
        const email = uniqueEmail(userName);

        await signInUser(page, email);

        await expect(
            page.getByText("email or password неправильні"),
        ).toBeVisible();
    });
});
