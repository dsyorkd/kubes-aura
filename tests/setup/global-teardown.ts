/**
 * Playwright Global Teardown
 *
 * Runs once after all test suites complete. Logs completion
 * for CI visibility and serves as a hook for future cleanup.
 */

import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('[global-teardown] All test suites completed.');
}

export default globalTeardown;
