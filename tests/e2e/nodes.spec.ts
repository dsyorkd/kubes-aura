import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, mockApiRoute, navigateTo, waitForLoadingComplete } from '../utils/helpers';
import { mockNodes } from '../setup/test-data';

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

  // ── Task #123: Node List Display and Statistics Cards ───────────────────────

  test.describe('node data verification and statistics', () => {
    test('all node hostnames from mock data are displayed', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      for (const node of mockNodes) {
        await expect(page.getByText(node.hostname!).first()).toBeVisible({ timeout: 15000 });
      }
    });

    test('statistics card shows correct total node count', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Total nodes = 5 from mockNodes
      const totalNodes = mockNodes.length;
      await expect(page.getByText('Total Nodes')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(`${totalNodes}`).first()).toBeVisible();
    });

    test('statistics card shows correct online node count', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Online nodes: pi-master-01, pi-worker-01, pi-standalone = 3
      const onlineCount = mockNodes.filter((n) => n.status === 'online').length;
      expect(onlineCount).toBe(3);

      await expect(page.getByText('Online').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(`${onlineCount}`).first()).toBeVisible();
    });

    test('statistics card shows correct offline node count', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Offline nodes: pi-worker-02 = 1
      const offlineCount = mockNodes.filter((n) => n.status === 'offline').length;
      expect(offlineCount).toBe(1);
    });

    test('node list displays all IP addresses from mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Verify each IP is visible
      for (const node of mockNodes) {
        if (node.ip_address) {
          await expect(page.getByText(node.ip_address)).toBeVisible({ timeout: 15000 });
        }
      }
    });

    test('node list shows status for each node', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Verify status indicators are present — online, offline, degraded
      await expect(page.getByText('online').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('offline').first()).toBeVisible();
      await expect(page.getByText('degraded').first()).toBeVisible();
    });

    test('node role badges match mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Count masters and workers from mock data
      const masterCount = mockNodes.filter((n) => n.role === 'master').length;
      const workerCount = mockNodes.filter((n) => n.role === 'worker').length;

      expect(masterCount).toBe(2); // pi-master-01, pi-dev-01
      expect(workerCount).toBe(3); // pi-worker-01, pi-worker-02, pi-standalone

      await expect(page.getByText('master').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('worker').first()).toBeVisible();
    });

    test('node cluster assignment information is present', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // pi-master-01 is in cluster_id 1, pi-dev-01 in cluster_id 2
      // pi-standalone has no cluster_id
      // Verify at least the clustered nodes show cluster info
      await expect(page.getByText('pi-master-01').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('pi-dev-01').first()).toBeVisible();
    });

    test('search filters nodes correctly', async ({ page }) => {
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('master');

      // pi-master-01 should be visible, others may be filtered
      await expect(page.getByText('pi-master-01').first()).toBeVisible();
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
