import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Pi-Controller E2E Testing
 *
 * This configuration supports:
 * - Parallel test execution for faster CI/CD
 * - Multiple reporters (HTML, JSON, JUnit) for flexibility
 * - Automatic dev server startup
 * - Screenshot and trace capture on failure
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 */
export default defineConfig({
  // Test directory structure
  testDir: './tests',

  // Global setup and teardown
  globalSetup: './tests/setup/global-setup.ts',
  globalTeardown: './tests/setup/global-teardown.ts',

  // Parallel execution for better performance
  fullyParallel: true,

  // Fail build on leftover .only() in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI for flakiness tolerance
  retries: process.env.CI ? 2 : 0,

  // Optimal worker count: 2 in CI, unlimited locally
  workers: process.env.CI ? 2 : undefined,

  // Multiple reporters for different use cases
  reporter: [
    ['html'], // Interactive HTML report
    ['json', { outputFile: 'test-results/results.json' }], // Machine-readable results
    ['junit', { outputFile: 'test-results/junit.xml' }], // CI integration
  ],

  // Global test configuration
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:8080',

    // Capture trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshot only on failures to save space
    screenshot: 'only-on-failure',

    // Video recording on first retry
    video: 'retain-on-failure',

    // Default timeout for actions (30s)
    actionTimeout: 30000,
  },

  // Browser projects for cross-browser testing
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Automatic dev server management
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
