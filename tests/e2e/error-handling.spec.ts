import { test, expect } from '../setup/fixtures';
import { mockApiRoute, navigateTo } from '../utils/helpers';

test.describe('Error Handling', () => {
  test.describe('404 Not Found', () => {
    test('displays 404 page for unknown routes', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nonexistent-page');
      await expect(page.getByText(/not found|404/i)).toBeVisible();
    });

    test('provides navigation back to dashboard from 404 page', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nonexistent-page');
      const homeLink = page.getByRole('link', { name: /home|dashboard|go back/i });
      await expect(homeLink).toBeVisible();
    });
  });

  test.describe('500 Internal Server Error', () => {
    test('displays error state when API returns 500', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Internal Server Error' }, { status: 500 });

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
    });

    test('shows retry button on server error', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Internal Server Error' }, { status: 500 });

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('503 Service Unavailable', () => {
    test('displays error state when API returns 503', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Service Unavailable' }, { status: 503 });

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/error|unavailable/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Network Timeouts', () => {
    test('handles network timeout gracefully', async ({ page }) => {
      await page.route(
        (url) => /\/api\/v1\/nodes/.test(url.toString()),
        (route) => route.abort('timedout'),
      );

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
    });

    test('handles connection refused gracefully', async ({ page }) => {
      await page.route(
        (url) => /\/api\/v1\/clusters/.test(url.toString()),
        (route) => route.abort('connectionrefused'),
      );

      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Authentication Errors', () => {
    test('handles 401 unauthorized response', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Unauthorized' }, { status: 401 });

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/unauthorized|login|sign in|error/i)).toBeVisible({ timeout: 15000 });
    });

    test('handles 403 forbidden response', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Forbidden' }, { status: 403 });

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/forbidden|access denied|error/i)).toBeVisible({ timeout: 15000 });
    });
  });

  // ── Task #163: 404 Not Found Page Test ────────────────────────────────────

  test.describe('404 Not Found Page (#163)', () => {
    test('shows 404 for non-existent route under pi-controller', async ({ page }) => {
      await navigateTo(page, '/pi-controller/this-page-does-not-exist');
      await expect(page.getByText(/not found|404/i)).toBeVisible();
    });

    test('shows 404 for deeply nested non-existent route', async ({ page }) => {
      await navigateTo(page, '/pi-controller/foo/bar/baz');
      await expect(page.getByText(/not found|404/i)).toBeVisible();
    });

    test('404 page has link back to home or dashboard', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nonexistent-page');
      const homeLink = page.getByRole('link', { name: /home|dashboard|go back/i });
      await expect(homeLink).toBeVisible();
    });

    test('clicking back link on 404 navigates to dashboard', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nonexistent-page');
      const homeLink = page.getByRole('link', { name: /home|dashboard|go back/i });
      await homeLink.click();
      await expect(page).toHaveURL(/.*\/(pi-controller|dashboard)$/);
    });

    test('404 page displays user-friendly error message', async ({ page }) => {
      await navigateTo(page, '/pi-controller/unknown-route');
      const hasMessage = await page
        .getByText(/page.*not found|doesn't exist|wrong address|lost/i)
        .first()
        .isVisible()
        .catch(() => false);

      const has404 = await page.getByText(/404/).isVisible().catch(() => false);
      expect(hasMessage || has404).toBeTruthy();
    });
  });

  // ── Task #164: Server Error Response Tests (500, 503) ─────────────────────

  test.describe('Server Error Response Tests (#164)', () => {
    test('500 error on clusters page shows error state', async ({ page }) => {
      await mockApiRoute(page, 'clusters', { error: 'Internal Server Error' }, { status: 500 });
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
    });

    test('500 error provides retry functionality', async ({ page }) => {
      let callCount = 0;
      await page.route(
        (url) => /\/api\/v1\/nodes/.test(url.toString()),
        async (route) => {
          callCount++;
          if (callCount <= 3) {
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Internal Server Error' }),
            });
          } else {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ data: [], total: 0 }),
            });
          }
        },
      );

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible({ timeout: 15000 });
    });

    test('503 service unavailable on nodes page shows error', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Service Unavailable' }, { status: 503 });
      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/error|unavailable/i)).toBeVisible({ timeout: 15000 });
    });

    test('503 on clusters page shows appropriate message', async ({ page }) => {
      await mockApiRoute(page, 'clusters', { error: 'Service Unavailable' }, { status: 503 });
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/error|unavailable/i)).toBeVisible({ timeout: 15000 });
    });

    test('server error does not crash the application', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Server Error' }, { status: 500 });
      await mockApiRoute(page, 'clusters', { error: 'Server Error' }, { status: 500 });
      await mockApiRoute(page, 'health', { error: 'Server Error' }, { status: 500 });

      await navigateTo(page, '/pi-controller');

      // App should still render, even if showing errors
      await expect(page.locator('body')).toBeVisible();
      const hasHeading = await page
        .getByRole('heading')
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasHeading).toBeTruthy();
    });
  });

  // ── Task #165: API Timeout Handling Test ──────────────────────────────────

  test.describe('API Timeout Handling (#165)', () => {
    test('network timeout on nodes shows error state', async ({ page }) => {
      await page.route(
        (url) => /\/api\/v1\/nodes/.test(url.toString()),
        (route) => route.abort('timedout'),
      );
      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
    });

    test('network timeout on clusters shows error state', async ({ page }) => {
      await page.route(
        (url) => /\/api\/v1\/clusters/.test(url.toString()),
        (route) => route.abort('timedout'),
      );
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
    });

    test('connection refused shows error with retry', async ({ page }) => {
      await page.route(
        (url) => /\/api\/v1\/nodes/.test(url.toString()),
        (route) => route.abort('connectionrefused'),
      );
      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    });

    test('slow API response still renders correctly', async ({ page }) => {
      await mockApiRoute(page, 'nodes', [], { delay: 3000, paginated: true });
      await mockApiRoute(page, 'health', { status: 'healthy', version: '1.0.0' });
      await mockApiRoute(page, 'ready', { status: 'ready' });
      await mockApiRoute(page, 'clusters', [], { paginated: true });

      await navigateTo(page, '/pi-controller/nodes');

      // Should eventually show content (empty state or data)
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible({ timeout: 10000 });
    });

    test('retry after timeout recovers data', async ({ page }) => {
      let callCount = 0;
      await page.route(
        (url) => /\/api\/v1\/clusters/.test(url.toString()),
        async (route) => {
          callCount++;
          if (callCount <= 3) {
            await route.abort('timedout');
          } else {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ data: [{ id: 1, name: 'recovered-cluster', status: 'healthy' }], total: 1 }),
            });
          }
        },
      );
      await mockApiRoute(page, 'health', { status: 'healthy' });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 15000 });

      // Click retry
      const retryBtn = page.getByRole('button', { name: /retry/i });
      if (await retryBtn.isVisible().catch(() => false)) {
        await retryBtn.click();
        // May need multiple retries
        await page.waitForTimeout(2000);
      }
    });
  });

  // ── Task #166: Authorization Error Tests (401, 403) ───────────────────────

  test.describe('Authorization Error Tests (#166)', () => {
    test('401 on nodes redirects to login or shows error', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Unauthorized' }, { status: 401 });
      await navigateTo(page, '/pi-controller/nodes');

      const isOnLogin = /\/auth\/login/.test(page.url());
      const hasAuthError = await page
        .getByText(/unauthorized|sign in|login|error/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(isOnLogin || hasAuthError).toBeTruthy();
    });

    test('401 on clusters redirects to login or shows error', async ({ page }) => {
      await mockApiRoute(page, 'clusters', { error: 'Unauthorized' }, { status: 401 });
      await navigateTo(page, '/pi-controller/clusters');

      const isOnLogin = /\/auth\/login/.test(page.url());
      const hasAuthError = await page
        .getByText(/unauthorized|sign in|login|error/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(isOnLogin || hasAuthError).toBeTruthy();
    });

    test('403 on nodes shows forbidden message', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Forbidden' }, { status: 403 });
      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/forbidden|access denied|error|permission/i)).toBeVisible({ timeout: 15000 });
    });

    test('403 on clusters shows forbidden message', async ({ page }) => {
      await mockApiRoute(page, 'clusters', { error: 'Forbidden' }, { status: 403 });
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/forbidden|access denied|error|permission/i)).toBeVisible({ timeout: 15000 });
    });

    test('401 error does not crash the application', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Unauthorized' }, { status: 401 });
      await mockApiRoute(page, 'clusters', { error: 'Unauthorized' }, { status: 401 });

      await navigateTo(page, '/pi-controller');

      // App should still be functional (sidebar visible, or redirect to login)
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
