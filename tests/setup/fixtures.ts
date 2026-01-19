import { test as base, Page } from '@playwright/test';

/**
 * Custom Test Fixtures for Pi-Controller E2E Tests
 *
 * This file extends Playwright's base test with custom fixtures
 * that provide pre-configured pages, mock data, and helper utilities.
 *
 * Usage:
 *   import { test, expect } from './setup/fixtures';
 *
 * Available Fixtures:
 *   - authenticatedPage: A page that is already logged in
 *   - mockNodes: Array of mock node data
 *   - mockClusters: Array of mock cluster data
 */

// Type definitions for mock data
export interface Node {
  id: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline' | 'degraded';
  role: 'master' | 'worker';
  cluster_id?: string;
  cpu_percent?: number;
  memory_percent?: number;
  disk_percent?: number;
  temperature?: number;
  uptime?: number;
  discovery_method?: 'mdns' | 'manual';
}

export interface Cluster {
  id: string;
  name: string;
  type: 'kubernetes' | 'standalone';
  status: 'healthy' | 'degraded' | 'unhealthy';
  nodes_online: number;
  nodes_total: number;
  region?: string;
  version?: string;
}

// Custom test fixtures interface
export interface TestFixtures {
  authenticatedPage: Page;
  mockNodes: Node[];
  mockClusters: Cluster[];
}

/**
 * Extended test object with custom fixtures
 *
 * TODO: Implement fixture logic as tests are developed
 * This is a placeholder structure that will be expanded in subsequent tasks.
 */
export const test = base.extend<TestFixtures>({
  /**
   * Authenticated Page Fixture
   *
   * Provides a pre-authenticated page session.
   * Will be implemented when authentication tests are created.
   */
  authenticatedPage: async ({ page }, use) => {
    // TODO: Implement authentication logic
    // For now, just pass through the regular page
    await use(page);
  },

  /**
   * Mock Nodes Fixture
   *
   * Provides an array of mock node data for testing.
   * Will be populated from test-data.ts when created.
   */
  mockNodes: async ({}, use) => {
    // TODO: Import from test-data.ts when available
    const nodes: Node[] = [];
    await use(nodes);
  },

  /**
   * Mock Clusters Fixture
   *
   * Provides an array of mock cluster data for testing.
   * Will be populated from test-data.ts when created.
   */
  mockClusters: async ({}, use) => {
    // TODO: Import from test-data.ts when available
    const clusters: Cluster[] = [];
    await use(clusters);
  },
});

// Export expect from Playwright for convenience
export { expect } from '@playwright/test';
