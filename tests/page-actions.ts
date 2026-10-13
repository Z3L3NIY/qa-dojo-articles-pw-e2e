import { Locator, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

//TODO ADD PASSWORD USING .env

export const uniqueUser = () =>
    `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const uniqueEmail = (userName: string) => `${userName}@example.com`;

export async function registerUser(
    page: Page,
    username: string,
    email: string,
    password: string = "ValidPassword123!",
) {
    await page.goto("/articles/register");
    await page.getByTestId("auth-username").fill(username);
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("register-confirm-password").fill(password);
    await page.getByTestId("register-terms").check();
    await page.getByTestId("auth-submit").click();
}

export async function signInUser(
    page: Page,
    email: string,
    password: string = "ValidPassword123!",
) {
    await page.goto("/articles/login");
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-submit").click();
}

export async function logOutUser(page: Page) {
    const profileLink: Locator = page.getByTestId("nav-profile");
    const editProfileLink: Locator = page.getByRole("link", {
        name: "Edit profile",
    });
    const logOutButton: Locator = page.getByTestId("logout-button");

    await profileLink.click();
    await editProfileLink.click();
    await logOutButton.click();
}

export async function followUser(page: Page, userName: string) {
    const profileFollowButton: Locator = page.getByTestId(
        "profile-follow-button",
    );

    await page.goto(`/articles/profile/${userName}}`);
    await profileFollowButton.click();
}

export async function createArticle(
    page: Page,
    title: string,
    description: string,
    body: string,
    tags: Array<string>,
    categoryIndex: number,
    visibilityIndex: number,
    allowComments: boolean,
    file: string = "dummy-logo.jpg",
) {
    const categories: Array<string> = [
        "general",
        "automation",
        "tools",
        "career",
        "news",
    ];
    const visibilities: Array<string> = ["public", "unlisted", "draft"];
    const imagePath: string = path.resolve(__dirname, `./fixtures/${file}`);

    const newArticleLink: Locator = page.getByRole("link", {
        name: "New article",
    });
    const titleInput: Locator = page.getByTestId("editor-title");
    const descriptionInput: Locator = page.getByTestId("editor-description");
    const bodyInput: Locator = page.getByTestId("editor-body");
    const tagsInput: Locator = page.getByTestId("editor-tags");
    const categorySelector: Locator = page.getByTestId("editor-category");
    const visibilityRadio: Locator = page.getByTestId(
        `editor-visibility-${visibilities[visibilityIndex]}`,
    );
    const visibilityRadioContainer: Locator = page.locator(".radio").filter({
        has: visibilityRadio,
    });
    const visibilityRadioDot: Locator =
        visibilityRadioContainer.locator(".dot");
    const allowCommentsBox: Locator = page.getByTestId("editor-allow-comments");
    const fileInput: Locator = page.getByTestId("editor-cover");
    const submitButton = page.getByTestId("editor-submit");

    await newArticleLink.click();

    await titleInput.fill(title);
    await descriptionInput.fill(description);
    await bodyInput.fill(body);
    await tagsInput.fill(tags.join(" "));

    if (
        categoryIndex in categories &&
        categories[categoryIndex] !== undefined
    ) {
        await categorySelector.selectOption(categories[categoryIndex]);
    } else throw new Error("No such category option!");

    if (
        visibilityIndex in visibilities &&
        visibilities[visibilityIndex] !== undefined
    ) {
        await visibilityRadioDot.click();
    } else throw new Error("No such visibility option!");

    if ((await allowCommentsBox.isChecked()) !== allowComments) {
        await allowCommentsBox.click();
    }

    if (!fs.existsSync(imagePath)) {
        throw new Error(`No such file: ${imagePath}`);
    } else {
        await fileInput.setInputFiles(imagePath);
    }
    await submitButton.click();
}
