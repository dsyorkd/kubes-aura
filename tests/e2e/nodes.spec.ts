import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, mockApiRoute, navigateTo, waitForLoadingComplete } from '../utils/helpers';

test.describe('Nodes', () => {
  test.describe('with mocked data', () => {
    test.beforeEach(async ({ page }) => {
      await setupDefaultApiMocks(page);
    });

    test('renders page heading and subtitle', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();
      await expect(page.getByText('Manage all Raspberry Pi nodes across clusters')).toBeVisible();
    });

    test('displays stats overview cards', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await expect(page.getByText('Total Nodes')).toBeVisible();
      await expect(page.getByText('Online').first()).toBeVisible();
    });

    test('displays node list with mocked data', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await expect(page.getByText('pi-master-01').first()).toBeVisible();
      await expect(page.getByText('pi-worker-01').first()).toBeVisible();
    });

    test('displays node IP addresses', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await expect(page.getByText('192.168.1.100')).toBeVisible();
      await expect(page.getByText('192.168.1.101')).toBeVisible();
    });

    test('displays search input and filter controls', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');

      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /add node/i })).toBeVisible();
    });

    test('displays role badges for nodes', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await expect(page.getByText('master').first()).toBeVisible();
      await expect(page.getByText('worker').first()).toBeVisible();
    });
  });

  test.describe('error and empty states', () => {
    test('shows error state when API fails', async ({ page }) => {
      // Abort the request to simulate network failure, which triggers axios error
      await page.route(
        (url) => /\/api\/v1\/nodes/.test(url.toString()),
        (route) => route.abort('connectionrefused'),
      );

      await navigateTo(page, '/pi-controller/nodes');

      // React Query retries 3 times with backoff (~7-8s), then sets isError
      await expect(page.getByText(/error loading nodes/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    });

    test('shows empty state when no nodes exist', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { data: [], total: 0 });

      await navigateTo(page, '/pi-controller/nodes');

      // Wait for empty state to render after mock returns empty data
      await expect(page.getByText(/no nodes found/i)).toBeVisible({ timeout: 15000 });
    });
  });
});
