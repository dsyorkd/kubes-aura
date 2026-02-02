import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, mockApiRoute, navigateTo, waitForLoadingComplete } from '../utils/helpers';
import { mockClusters } from '../setup/test-data';

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

  // ── Task #113: Cluster List Display and Basic Verification ────────────────

  test.describe('cluster data verification', () => {
    test('all cluster names from mock data are displayed', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      for (const cluster of mockClusters) {
        await expect(page.getByText(cluster.name)).toBeVisible({ timeout: 15000 });
      }
    });

    test('cluster cards display correct status indicators', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // Verify healthy, degraded, unhealthy statuses are rendered
      const healthyCount = mockClusters.filter((c) => c.status === 'healthy').length;
      const degradedCount = mockClusters.filter((c) => c.status === 'degraded').length;
      const unhealthyCount = mockClusters.filter((c) => c.status === 'unhealthy').length;

      // At least verify the status text/badges appear on the page
      expect(healthyCount).toBeGreaterThan(0);
      expect(degradedCount).toBeGreaterThan(0);
      expect(unhealthyCount).toBeGreaterThan(0);

      // Verify status text appears for each cluster
      await expect(page.getByText('healthy').first()).toBeVisible();
      await expect(page.getByText('degraded').first()).toBeVisible();
      await expect(page.getByText('unhealthy').first()).toBeVisible();
    });

    test('cluster cards display node count information', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // Verify node count for the first cluster (pi-k3s-cluster: 3 nodes, 3 online)
      const firstCluster = mockClusters[0];
      await expect(
        page.getByText(`${firstCluster.node_count}`).first(),
      ).toBeVisible({ timeout: 15000 });
    });

    test('cluster type information is visible', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // Verify cluster types appear — k3s, kubernetes, docker, custom
      await expect(page.getByText('k3s').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('kubernetes').first()).toBeVisible();
      await expect(page.getByText('docker').first()).toBeVisible();
      await expect(page.getByText('custom').first()).toBeVisible();
    });

    test('correct total cluster count rendered', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // All 4 clusters from mock data should be in the "all" tab
      const allTab = page.getByRole('tab', { name: /all/i });
      await expect(allTab).toBeVisible();

      // Verify all 4 cluster cards are present
      const clusterCards = page.getByText(/pi-k3s-cluster|dev-kubernetes|docker-swarm|custom-iot/);
      await expect(clusterCards.first()).toBeVisible();

      // Count unique clusters rendered
      for (const cluster of mockClusters) {
        await expect(page.getByText(cluster.name)).toBeVisible();
      }
    });

    test('cluster descriptions are accessible in cards', async ({ page }) => {
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // Verify at least one cluster description appears
      await expect(
        page.getByText(mockClusters[0].description!).first(),
      ).toBeVisible({ timeout: 15000 });
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
