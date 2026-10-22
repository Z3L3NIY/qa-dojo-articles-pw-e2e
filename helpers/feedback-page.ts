import { Page } from "@playwright/test";

export type FeedbackPageLocators = ReturnType<typeof getFeedbackPageLocators>;

export function getFeedbackPageLocators(page: Page) {
    return {
        nameInput: () => page.getByTestId("contact-name"),
        emailInput: () => page.getByTestId("contact-email"),
        subjectInput: () => page.getByTestId("contact-subject"),
        priorityRadio: (priority: string) =>
            page.getByTestId(`contact-priority-${priority}`),
        messageTextarea: () => page.getByTestId("contact-message"),
        fileInput: () => page.getByTestId("contact-attachments"),
        copyMeCheckbox: () => page.getByTestId("contact-copy-me"),
        resetButton: () => page.getByTestId("contact-reset"),
        submitButton: () => page.getByTestId("contact-submit"),
        successTitle: () =>
            page.getByTestId("contact-success").getByRole("heading", {
                level: 1,
                name: "Дякуємо! 🎉",
                exact: true,
            }),
        successMessage: (email: string) =>
            page
                .getByTestId("contact-success")
                .getByText(
                    `Ваше звернення надіслано. Ми відповімо на ${email}.`,
                    { exact: true },
                ),
        sendMoreButton: () =>
            page.getByTestId("contact-success").getByRole("button", {
                name: "Надіслати ще одне",
                exact: true,
            }),
        errorMessages: () => page.getByTestId("error-messages"),
    };
}
