import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, navigateTo, waitForLoadingComplete } from '../utils/helpers';
import { mockNodes, mockClusters } from '../setup/test-data';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultApiMocks(page);
  });

  test('renders page heading and subtitle', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    await expect(page.getByText('Overview of your Raspberry Pi infrastructure')).toBeVisible();
  });

  test('displays four stats cards with mocked data', async ({ page }) => {
    await navigateTo(page, '/pi-controller');

    // Wait for mock data to render (skeletons replaced by computed values)
    await expect(page.getByText('3 online, 2 offline')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('All types')).toBeVisible();
    await expect(page.getByText('46%')).toBeVisible();
    await expect(page.getByText('Normal range')).toBeVisible();
  });

  test('displays Refresh button', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('displays Quick Actions with navigation links', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByRole('button', { name: /view all clusters/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /hardware control/i })).toBeVisible();
  });

  test('displays node list when nodes are present', async ({ page }) => {
    await navigateTo(page, '/pi-controller');

    // Wait for node data to load from mocks
    await expect(page.getByText('pi-master-01')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('pi-worker-01')).toBeVisible();
    await expect(page.getByText('192.168.1.100')).toBeVisible();
  });

  test('displays System Health card with mocked health data', async ({ page }) => {
    await navigateTo(page, '/pi-controller');

    // Wait for health data to load from mocks
    await expect(page.getByText('System Health')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('healthy')).toBeVisible();
    await expect(page.getByText('v1.0.0')).toBeVisible();
  });

  test('navigates to clusters page via Quick Actions', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await page.getByRole('button', { name: /view all clusters/i }).click();
    await expect(page).toHaveURL(/.*\/clusters/);
  });

  // ── Task #103: Dashboard Overview Metrics Display ───────────────────────────

  test.describe('Overview Metrics', () => {
    test('displays total node count from mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // mockNodes has 5 nodes total
      const totalNodes = mockNodes.length;
      await expect(page.getByText(`${totalNodes}`).first()).toBeVisible({ timeout: 15000 });
    });

    test('displays correct online and offline node counts', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // Count online/offline from mock data
      const onlineCount = mockNodes.filter((n) => n.status === 'online').length; // 3
      const offlineCount = mockNodes.filter(
        (n) => n.status === 'offline' || n.status === 'degraded',
      ).length; // 2

      // Dashboard shows "3 online, 2 offline"
      await expect(
        page.getByText(`${onlineCount} online, ${offlineCount} offline`),
      ).toBeVisible({ timeout: 15000 });
    });

    test('displays cluster count from mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // mockClusters has 4 clusters with different types
      const totalClusters = mockClusters.length;
      // The dashboard shows cluster type info — "All types" text
      await expect(page.getByText('All types')).toBeVisible({ timeout: 15000 });
      // Verify the count appears somewhere on the page
      await expect(page.getByText(`${totalClusters}`).first()).toBeVisible();
    });

    test('displays average CPU usage metric', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // The dashboard shows computed average CPU — "46%" from the existing test
      // This comes from averaging the online nodes' CPU values
      await expect(page.getByText('46%')).toBeVisible({ timeout: 15000 });
    });

    test('displays temperature status', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // Dashboard shows "Normal range" for temperature indicator
      await expect(page.getByText('Normal range')).toBeVisible({ timeout: 15000 });
    });

    test('stats cards render all four metric categories', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // The dashboard has 4 stats cards: Nodes, Clusters, CPU, Temperature
      // Verify all four metric areas are present
      const statsTexts = [
        page.getByText(`${mockNodes.filter((n) => n.status === 'online').length} online`).first(),
        page.getByText('All types'),
        page.getByText('46%'),
        page.getByText('Normal range'),
      ];

      for (const stat of statsTexts) {
        await expect(stat).toBeVisible({ timeout: 15000 });
      }
    });

    test('node list on dashboard matches mock data hostnames', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // Verify individual node hostnames from mock data appear
      for (const node of mockNodes.slice(0, 3)) {
        await expect(page.getByText(node.hostname!).first()).toBeVisible({ timeout: 15000 });
      }
    });

    test('node list shows IP addresses from mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // Verify IP addresses from mock data
      await expect(page.getByText(mockNodes[0].ip_address!)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(mockNodes[1].ip_address!)).toBeVisible();
    });

    test('system health card shows version from mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // Health response mock returns version 1.0.0 and status healthy
      await expect(page.getByText('System Health')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('v1.0.0')).toBeVisible();
      await expect(page.getByText('healthy')).toBeVisible();
    });
  });
});
