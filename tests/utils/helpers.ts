/**
 * Test Helper Utilities for Pi-Controller E2E Tests
 *
 * Provides reusable functions for common test operations like
 * navigation, API mocking, authentication, and waiting for UI states.
 */

import type { Page, Route } from '@playwright/test';
import { expect } from '@playwright/test';
import {
  mockHealthResponse,
  mockClusters,
  mockNodes,
  mockGpioPins,
  mockAuthToken,
  mockUsers,
  createPaginatedResponse,
  type PaginatedResponse,
} from '../setup/test-data';

/**
 * Perform a UI login flow by navigating to the login page, filling
 * the form, and waiting for a redirect to the dashboard.
 */
export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

/**
 * Wait for a specific API response matching the given endpoint pattern.
 * Returns the parsed JSON body of the response.
 */
export async function waitForApiResponse(page: Page, endpoint: string): Promise<unknown> {
  const response = await page.waitForResponse(
    (resp) => resp.url().includes(`/api/v1/${endpoint}`) && resp.status() === 200,
    { timeout: 10000 },
  );
  return response.json();
}

/**
 * Navigate to a path under the app's base path and wait for DOM content to load.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  await page.goto(normalizedPath, { waitUntil: 'domcontentloaded' });
}

/**
 * Core API mocking utility. Intercepts requests to the given endpoint
 * and returns the provided data as a JSON response.
 */
export async function mockApiRoute<T>(
  page: Page,
  endpoint: string,
  data: T,
  options: {
    status?: number;
    delay?: number;
    method?: string;
    paginated?: boolean;
  } = {},
): Promise<void> {
  const { status = 200, delay = 0, method, paginated = false } = options;

  // Build a regex that matches the endpoint path, ignoring query strings.
  // Supports wildcard segments: 'nodes/*' matches 'nodes/1', 'nodes/abc', etc.
  const escaped = endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\\\*/g, '[^/]+');
  const pathRegex = new RegExp(`/api/v1/${pattern}(\\?.*)?$`);

  await page.route(
    (url) => pathRegex.test(url.toString()),
    async (route: Route) => {
      if (method && route.request().method().toUpperCase() !== method.toUpperCase()) {
        await route.fallback();
        return;
      }

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const body = paginated
        ? createPaginatedResponse(data as unknown[])
        : data;

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    },
  );
}

/**
 * Assert that a heading with the given text is visible on the page.
 */
export async function assertPageTitle(page: Page, title: string): Promise<void> {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

/**
 * Wait for common loading indicators (skeleton loaders, spinners,
 * and loading text) to disappear from the page.
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  // Wait for skeleton loaders
  const skeletons = page.locator('[class*="skeleton"], [data-testid="skeleton"]');
  if ((await skeletons.count()) > 0) {
    await skeletons.first().waitFor({ state: 'hidden', timeout: 10000 });
  }

  // Wait for spinners
  const spinners = page.locator('[class*="spinner"], [role="progressbar"], [data-testid="spinner"]');
  if ((await spinners.count()) > 0) {
    await spinners.first().waitFor({ state: 'hidden', timeout: 10000 });
  }

  // Wait for any "Loading..." text
  const loadingText = page.getByText(/^loading/i);
  if ((await loadingText.count()) > 0) {
    await loadingText.first().waitFor({ state: 'hidden', timeout: 10000 });
  }
}

/**
 * Inject auth state into localStorage so ProtectedRoute allows access.
 * Must be called before navigating to any protected page.
 */
export async function injectAuthState(page: Page): Promise<void> {
  const testUser = {
    id: mockUsers[0].id,
    username: mockUsers[0].username,
    email: mockUsers[0].email,
    role: mockUsers[0].role,
    createdAt: mockUsers[0].created_at,
  };

  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('pi-controller-token', token);
      localStorage.setItem('pi-controller-refresh-token', `${token}-refresh`);
      localStorage.setItem('pi-controller-user', JSON.stringify(user));
    },
    { token: mockAuthToken, user: testUser },
  );
}

/**
 * Set up mock responses for all commonly used API endpoints.
 * Call this at the start of tests that need a fully mocked backend.
 * Also injects auth state so ProtectedRoute does not redirect to login.
 */
export async function setupDefaultApiMocks(page: Page): Promise<void> {
  await injectAuthState(page);
  await mockApiRoute(page, 'health', mockHealthResponse);
  await mockApiRoute(page, 'ready', { status: 'ready' });
  await mockApiRoute(page, 'clusters', mockClusters, { paginated: true });
  await mockApiRoute(page, 'clusters/*', mockClusters[0]);
  await mockApiRoute(page, 'nodes', mockNodes, { paginated: true });
  await mockApiRoute(page, 'nodes/*', mockNodes[0]);
  await mockApiRoute(page, 'nodes/*/gpio', mockGpioPins, { paginated: true });
}
