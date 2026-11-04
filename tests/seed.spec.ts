import { test, expect } from '@playwright/test';

test.describe('Articles', () => {
  test('seed', async ({ page }) => {
    await page.goto('/articles');
  });
});
