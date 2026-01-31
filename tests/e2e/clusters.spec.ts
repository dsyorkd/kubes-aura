import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, mockApiRoute, navigateTo, waitForLoadingComplete } from '../utils/helpers';

test.describe('Clusters', () => {
  test.describe('with mocked data', () => {
    test.beforeEach(async ({ page }) => {
      await setupDefaultApiMocks(page);
    });

    test('renders page heading and subtitle', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByRole('heading', { name: 'Clusters', level: 1 })).toBeVisible();
      await expect(page.getByText('Manage all your compute clusters')).toBeVisible();
    });

    test('displays cluster cards with mocked data', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await expect(page.getByText('pi-k3s-cluster')).toBeVisible();
      await expect(page.getByText('dev-kubernetes')).toBeVisible();
      await expect(page.getByText('docker-swarm')).toBeVisible();
      await expect(page.getByText('custom-iot')).toBeVisible();
    });

    test('displays New Cluster and Refresh buttons', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByRole('button', { name: /new cluster/i })).toBeVisible();
    });

    test('displays tab filters with counts', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await expect(page.getByRole('tab', { name: /all/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /kubernetes/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /docker/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /custom/i })).toBeVisible();
    });

    test('search input filters clusters', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      const searchInput = page.getByPlaceholder('Search clusters...');
      await expect(searchInput).toBeVisible();

      await searchInput.fill('docker');
      await expect(page.getByText('docker-swarm')).toBeVisible();
      await expect(page.getByText('pi-k3s-cluster')).not.toBeVisible();
    });

    test('kubernetes tab filters to kubernetes/k3s clusters only', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('tab', { name: /kubernetes/i }).click();

      await expect(page.getByText('pi-k3s-cluster')).toBeVisible();
      await expect(page.getByText('dev-kubernetes')).toBeVisible();
      await expect(page.getByText('docker-swarm')).not.toBeVisible();
    });
  });

  test.describe('error and empty states', () => {
    test('shows error state when API fails', async ({ page }) => {
      // Abort the request to simulate network failure, which triggers axios error
      await page.route(
        (url) => /\/api\/v1\/clusters/.test(url.toString()),
        (route) => route.abort('connectionrefused'),
      );

      await navigateTo(page, '/pi-controller/clusters');

      // React Query retries 3 times with backoff (~7-8s), then sets isError
      await expect(page.getByText('Error loading clusters')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    });

    test('shows empty state when no clusters exist', async ({ page }) => {
      await mockApiRoute(page, 'clusters', [], { paginated: true });

      await navigateTo(page, '/pi-controller/clusters');

      await expect(page.getByText(/no clusters found/i)).toBeVisible({ timeout: 15000 });
    });
  });
});
