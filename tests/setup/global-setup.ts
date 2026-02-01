/**
 * Playwright Global Setup
 *
 * Runs once before all test suites. Validates the test environment
 * and logs configuration for CI visibility.
 */

import type { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:8080';
  const isCI = !!process.env.CI;
  const workers = config.workers;

  console.log('[global-setup] Pi-Controller E2E Test Suite');
  console.log(`[global-setup]   Base URL: ${baseURL}`);
  console.log(`[global-setup]   CI mode: ${isCI}`);
  console.log(`[global-setup]   Workers: ${workers}`);
  console.log(`[global-setup]   Projects: ${config.projects.map(p => p.name).join(', ')}`);
}

export default globalSetup;
