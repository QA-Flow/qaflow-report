import { test, expect } from '@playwright/test';
import reporter from '@qaflow/report';
import dotenv from 'dotenv';
dotenv.config();

test.beforeAll(async () => {
  reporter.initialize(process.env.API_KEY || '');
});

test.describe('QAFlow Reporter with Playwright', async () => {
  test.beforeEach(async ({ page, browserName }) => {
    const userAgent = await page.evaluate(() => navigator.userAgent);
    
    reporter.createTest(
      'Playwright E2E Test',
      'Testing QAFlow reporter integration with Playwright',
      { author: 'Test Engineer', email: 'engineer@example.com' },
      { 
        name: 'Playwright Test Environment', 
        os: process.platform,
        browser: browserName,
        viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}`,
        device: userAgent
      }
    );
  });

  test('home page navbar links', async ({ page }) => {
    await reporter.step('Navigate to home page', async () => {
      await page.goto(process.env.BASE_URL || '');
      await page.waitForLoadState('domcontentloaded');
    });

    await reporter.step('Click on Sign In link', async () => {
      const signInLink = page.locator('a:has-text("Sign In")');
      await signInLink.click();
    });

    await reporter.step('Verify Sign In page', async () => {
      await expect(page).toHaveURL(process.env.BASE_URL + '/login');
    });

    await reporter.step('Navigate back to home page', async () => {
      await page.goBack();
    });

    await reporter.step('Verify home page navbar links again', async () => {
      const signUpLink = page.locator('a:has-text("Sign Up")');
      await signUpLink.click();
    });

    await reporter.step('Verify Sign Up page', async () => {
      await expect(page).toHaveURL(process.env.BASE_URL + '/register');
    });
  });

  test.afterEach(async () => {
    const results = await reporter.end();
    console.log('Test results:', results);
  });
}); 
