import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  testMatch: '*.@(spec|e2e|test).?(c|m)[jt]s?(x)',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: './test-results/playwright/html-report' }]],
  outputDir: './test-results/playwright/traces',
  
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
    browserName: "chromium",
    baseURL: process.env.BASE_URL
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],

});
