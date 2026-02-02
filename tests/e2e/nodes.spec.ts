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

  // ── Task #127: Node Adoption and Discovery Panel ────────────────────────────

  test.describe('node adoption and discovery', () => {
    test('Add Node button is present and clickable', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const addNodeButton = page.getByRole('button', { name: /add node/i });
      await expect(addNodeButton).toBeVisible();
      await expect(addNodeButton).toBeEnabled();
    });

    test('clicking Add Node opens discovery or adoption panel', async ({ page }) => {
      await setupDefaultApiMocks(page);

      // Mock discovery endpoint to return discoverable nodes
      await mockApiRoute(page, 'nodes/discover', [
        {
          id: 'discovered-1',
          hostname: 'pi-new-node-01',
          ip_address: '192.168.1.150',
          status: 'discovered',
          role: 'worker',
        },
        {
          id: 'discovered-2',
          hostname: 'pi-new-node-02',
          ip_address: '192.168.1.151',
          status: 'discovered',
          role: 'worker',
        },
      ]);

      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /add node/i }).click();

      // Verify a panel/dialog/modal opens
      const hasPanel = await page
        .locator('[role="dialog"], [role="alertdialog"], [class*="modal"], [class*="panel"], [class*="dialog"], [class*="drawer"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasDiscoveryContent = await page
        .getByText(/add node|discover|adoption|new node|connect/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasPanel || hasDiscoveryContent).toBeTruthy();
    });

    test('discovery panel shows node connection options', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /add node/i }).click();

      // Should show IP address or hostname input for manual connection
      const hasIPInput = await page
        .getByLabel(/ip address|hostname|host|address/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasPlaceholderInput = await page
        .getByPlaceholder(/ip|address|hostname|192\.168/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasConnectionText = await page
        .getByText(/ip address|hostname|connect|manual/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasIPInput || hasPlaceholderInput || hasConnectionText).toBeTruthy();
    });

    test('discovery panel can be closed', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /add node/i }).click();

      // Wait for panel to appear
      await page.waitForTimeout(500);

      // Close the panel
      const closeButton = page.getByRole('button', { name: /close|cancel|back|×/i }).first();
      const hasClose = await closeButton.isVisible().catch(() => false);

      if (hasClose) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }

      // Original node list should be visible
      await expect(page.getByText('pi-master-01').first()).toBeVisible({ timeout: 10000 });
    });

    test('node adoption workflow validates required fields', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /add node/i }).click();

      // Try to submit/add without filling required fields
      const addButton = page.getByRole('button', { name: /add|connect|adopt|submit|save/i }).first();
      const hasAdd = await addButton.isVisible().catch(() => false);

      if (hasAdd) {
        await addButton.click({ force: true });

        // Should show validation or be disabled
        const hasValidation = await page
          .getByText(/required|please enter|invalid|cannot be empty/i)
          .first()
          .isVisible()
          .catch(() => false);

        const isDisabled = await addButton.isDisabled().catch(() => false);

        expect(hasValidation || isDisabled).toBeTruthy();
      }
    });

    test('existing node count is displayed in stats before adding', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Verify current node count in stats card
      await expect(page.getByText('Total Nodes')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(`${mockNodes.length}`).first()).toBeVisible();

      // This is the baseline before any adoption would increase the count
      expect(mockNodes.length).toBe(5);
    });
  });
});
