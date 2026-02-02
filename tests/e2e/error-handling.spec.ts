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
});
