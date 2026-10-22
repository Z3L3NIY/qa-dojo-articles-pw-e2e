import { test, expect, Page, Locator } from "@playwright/test";
import {
    uniqueUser,
    uniqueEmail,
    registerUser,
    signInUser,
    logOutUser,
    followUser,
    createArticle,
    sendFeedbackForm,
} from "./actions";
import {
    getFeedbackPageLocators,
    FeedbackPageLocators,
} from "../helpers/feedback-page";

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
        await page.goto("/articles/register");
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

test.describe("Articles manipulation", async () => {
    test("Multiple articles creation", async ({ page }) => {
        const articlesUserName = uniqueUser();
        const articlesEmail = uniqueEmail(articlesUserName);
        const feedUserName = uniqueUser();
        const feedEmail = uniqueEmail(feedUserName);
        const titles = [];
        const runId = Date.now();

        const profileLink: Locator = page.getByTestId("nav-profile");
        const createdArticlePageTitle: Locator =
            page.getByTestId("article-title");
        const articlePreviewTitle: Locator = page.getByTestId("preview-title");

        await registerUser(page, articlesUserName, articlesEmail);
        await page.waitForURL("/articles");
        await expect(page.getByText(`${articlesUserName}`)).toBeVisible();

        for (let i = 1; i <= 10; ++i) {
            const title = `Article-${runId}-${i}`;
            await createArticle(
                page,
                title,
                "Description",
                "Body",
                ["tag1", "tag2"],
                2,
                1,
                true,
            );
            titles.push(title);
            await expect(createdArticlePageTitle).toHaveText(title);
        }

        await logOutUser(page);
        await registerUser(page, feedUserName, feedEmail);
        await followUser(page, articlesUserName);

        await page.goto("/articles");
        await expect.poll(() => articlePreviewTitle.count()).toBe(10);
        for (const title of titles) {
            await expect
                .soft(
                    page.getByRole("heading", {
                        level: 2,
                        name: title,
                        exact: true,
                    }),
                    `${title} is not created`,
                )
                .toBeVisible();
        }
    });
});

test.describe("Feedback form", async () => {
    const testsData = [
        {
            title: "Send form with all possible data",
            name: "Required name",
            email: "required@email.com",
            subject: "bug",
            priority: "low",
            message: "Required message.",
            file: "dummy-logo.jpg",
            copyMe: true,
            verify: async (
                locators: FeedbackPageLocators,
                testData: { email?: string },
            ) => {
                await expect(locators.successTitle()).toBeVisible();
                await expect(
                    locators.successMessage(testData.email!),
                ).toBeVisible();
                await expect(locators.sendMoreButton()).toBeVisible();
            },
        },
        {
            title: "Send form with only required data",
            name: "Required name",
            email: "required@email.com",
            message: "Required message.",
            verify: async (
                locators: FeedbackPageLocators,
                testData: { email?: string },
            ) => {
                await expect(locators.successTitle()).toBeVisible();
                await expect(
                    locators.successMessage(testData.email!),
                ).toBeVisible();
                await expect(locators.sendMoreButton()).toBeVisible();
            },
        },
        {
            title: "Send form with only optional data",
            subject: "bug",
            priority: "low",
            file: "dummy-logo.jpg",
            copyMe: true,
            verify: async (locators: FeedbackPageLocators) => {
                await expect(locators.errorMessages().locator("p")).toHaveText([
                    "name обов'язкове поле",
                    "email некоректний email",
                    "message обов'язкове поле",
                ]);
            },
        },
    ];

    test.beforeEach("Open feedback form", async ({ page }) => {
        await page.goto("/articles/contact");
    });

    for (const testData of testsData) {
        test(`${testData.title}`, async ({ page }) => {
            const locators = getFeedbackPageLocators(page);

            await sendFeedbackForm(locators, testData);

            await testData.verify(locators, testData);
        });
    }
});
