import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  mockNodes as mockNodeData,
  mockClusters as mockClusterData,
  mockAuthToken,
  mockUsers,
  type Node,
  type Cluster,
} from './test-data';

/**
 * Custom Test Fixtures for Pi-Controller E2E Tests
 *
 * Usage:
 *   import { test, expect } from './setup/fixtures';
 *
 * Available Fixtures:
 *   - authenticatedPage: A page with auth tokens pre-set in localStorage
 *   - mockNodes: Array of mock node data from test-data.ts
 *   - mockClusters: Array of mock cluster data from test-data.ts
 */

export interface TestFixtures {
  authenticatedPage: Page;
  mockNodes: Node[];
  mockClusters: Cluster[];
}

export const test = base.extend<TestFixtures>({
  /**
   * Authenticated Page Fixture
   *
   * Sets pi-controller auth tokens in localStorage before the test
   * navigates to any application page.
   */
  authenticatedPage: async ({ page }, use) => {
    // Navigate to a blank page first so we can set localStorage on the origin
    await page.goto('about:blank');
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('pi-controller-token', token);
        localStorage.setItem('pi-controller-user', JSON.stringify(user));
      },
      { token: mockAuthToken, user: mockUsers[0] },
    );
    await use(page);
  },

  mockNodes: async ({}, use) => {
    await use(mockNodeData);
  },

  mockClusters: async ({}, use) => {
    await use(mockClusterData);
  },
});

export { expect } from '@playwright/test';
