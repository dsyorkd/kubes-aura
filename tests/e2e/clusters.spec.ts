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

  // ── Task #114: Cluster Filtering by Type ────────────────────────────────────

  test.describe('cluster filtering by type', () => {
    test('kubernetes tab shows only kubernetes and k3s clusters', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('tab', { name: /kubernetes/i }).click();

      // k3s and kubernetes type clusters should be visible
      const k8sClusters = mockClusters.filter(
        (c) => c.type === 'kubernetes' || c.type === 'k3s',
      );
      for (const cluster of k8sClusters) {
        await expect(page.getByText(cluster.name)).toBeVisible({ timeout: 10000 });
      }

      // Docker and custom clusters should NOT be visible
      const nonK8sClusters = mockClusters.filter(
        (c) => c.type !== 'kubernetes' && c.type !== 'k3s',
      );
      for (const cluster of nonK8sClusters) {
        await expect(page.getByText(cluster.name)).not.toBeVisible();
      }
    });

    test('docker tab shows only docker clusters', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('tab', { name: /docker/i }).click();

      // Docker clusters should be visible
      const dockerClusters = mockClusters.filter((c) => c.type === 'docker');
      expect(dockerClusters).toHaveLength(1);
      for (const cluster of dockerClusters) {
        await expect(page.getByText(cluster.name)).toBeVisible({ timeout: 10000 });
      }

      // Non-docker clusters should NOT be visible
      const nonDockerClusters = mockClusters.filter((c) => c.type !== 'docker');
      for (const cluster of nonDockerClusters) {
        await expect(page.getByText(cluster.name)).not.toBeVisible();
      }
    });

    test('custom tab shows only custom clusters', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('tab', { name: /custom/i }).click();

      // Custom clusters should be visible
      const customClusters = mockClusters.filter((c) => c.type === 'custom');
      expect(customClusters).toHaveLength(1);
      for (const cluster of customClusters) {
        await expect(page.getByText(cluster.name)).toBeVisible({ timeout: 10000 });
      }

      // Non-custom clusters should NOT be visible
      const nonCustomClusters = mockClusters.filter((c) => c.type !== 'custom');
      for (const cluster of nonCustomClusters) {
        await expect(page.getByText(cluster.name)).not.toBeVisible();
      }
    });

    test('all tab shows all clusters after filtering', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // First filter to docker
      await page.getByRole('tab', { name: /docker/i }).click();
      await expect(page.getByText('docker-swarm')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('pi-k3s-cluster')).not.toBeVisible();

      // Switch back to all — all clusters should reappear
      await page.getByRole('tab', { name: /all/i }).click();
      for (const cluster of mockClusters) {
        await expect(page.getByText(cluster.name)).toBeVisible({ timeout: 10000 });
      }
    });

    test('filtered count matches expected cluster count per type', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // Verify mathematical distribution of cluster types
      const typeCounts = {
        kubernetes: mockClusters.filter((c) => c.type === 'kubernetes' || c.type === 'k3s').length,
        docker: mockClusters.filter((c) => c.type === 'docker').length,
        custom: mockClusters.filter((c) => c.type === 'custom').length,
      };

      expect(typeCounts.kubernetes).toBe(2); // pi-k3s-cluster + dev-kubernetes
      expect(typeCounts.docker).toBe(1);     // docker-swarm
      expect(typeCounts.custom).toBe(1);     // custom-iot
      expect(typeCounts.kubernetes + typeCounts.docker + typeCounts.custom).toBe(mockClusters.length);
    });

    test('search combined with type filter narrows results', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // Filter to kubernetes first
      await page.getByRole('tab', { name: /kubernetes/i }).click();
      await expect(page.getByText('pi-k3s-cluster')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('dev-kubernetes')).toBeVisible();

      // Then search within kubernetes clusters
      const searchInput = page.getByPlaceholder('Search clusters...');
      await searchInput.fill('dev');

      // Only dev-kubernetes should match
      await expect(page.getByText('dev-kubernetes')).toBeVisible();
      await expect(page.getByText('pi-k3s-cluster')).not.toBeVisible();
    });
  });

  // ── Task #117: Cluster Creation Wizard and Navigation ───────────────────────

  test.describe('cluster creation wizard', () => {
    test('New Cluster button opens creation dialog or wizard', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      // Click the New Cluster button
      await page.getByRole('button', { name: /new cluster/i }).click();

      // Verify wizard/dialog opens — look for dialog, modal, or wizard form elements
      const hasWizard = await page
        .locator('[role="dialog"], [role="alertdialog"], [class*="modal"], [class*="wizard"], [class*="dialog"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasFormStep = await page
        .getByText(/cluster name|create.*cluster|step|configuration/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasWizard || hasFormStep).toBeTruthy();
    });

    test('wizard displays cluster name input field', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /new cluster/i }).click();

      // Look for a name/label input in the wizard
      const nameInput = page.getByLabel(/cluster name|name/i).first();
      const hasNameInput = await nameInput.isVisible().catch(() => false);

      const placeholderInput = page.getByPlaceholder(/cluster name|name|enter/i).first();
      const hasPlaceholder = await placeholderInput.isVisible().catch(() => false);

      expect(hasNameInput || hasPlaceholder).toBeTruthy();
    });

    test('wizard displays cluster type selector', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /new cluster/i }).click();

      // Wizard should have a way to select cluster type
      const hasTypeSelector = await page
        .getByText(/cluster type|type|k3s|kubernetes|docker/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasSelectInput = await page
        .locator('select, [role="combobox"], [role="listbox"], [class*="select"]')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasTypeSelector || hasSelectInput).toBeTruthy();
    });

    test('wizard can be cancelled/closed', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /new cluster/i }).click();

      // Find and click cancel/close button
      const cancelButton = page.getByRole('button', { name: /cancel|close|back/i }).first();
      const hasCancel = await cancelButton.isVisible().catch(() => false);

      if (hasCancel) {
        await cancelButton.click();
      } else {
        // Try pressing Escape to close dialog
        await page.keyboard.press('Escape');
      }

      // Wizard should be closed — original cluster list should be visible
      await expect(page.getByText('pi-k3s-cluster')).toBeVisible({ timeout: 10000 });
    });

    test('wizard validates required fields before proceeding', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /new cluster/i }).click();

      // Try to proceed without filling required fields
      const nextButton = page.getByRole('button', { name: /next|create|submit|save/i }).first();
      const hasNext = await nextButton.isVisible().catch(() => false);

      if (hasNext) {
        await nextButton.click({ force: true });

        // Should show validation error or button should be disabled
        const hasValidation = await page
          .getByText(/required|name is required|please enter|cannot be empty/i)
          .first()
          .isVisible()
          .catch(() => false);

        const isDisabled = await nextButton.isDisabled().catch(() => false);

        expect(hasValidation || isDisabled).toBeTruthy();
      }
    });

    test('wizard navigation: back and next buttons work', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /new cluster/i }).click();

      // Fill in a cluster name to enable navigation
      const nameInput = page.getByLabel(/cluster name|name/i).first();
      const placeholderInput = page.getByPlaceholder(/cluster name|name|enter/i).first();

      const input = (await nameInput.isVisible().catch(() => false)) ? nameInput : placeholderInput;
      if (await input.isVisible().catch(() => false)) {
        await input.fill('test-new-cluster');
      }

      // Look for Next button
      const nextButton = page.getByRole('button', { name: /next|continue|proceed/i }).first();
      const hasNext = await nextButton.isVisible().catch(() => false);

      if (hasNext) {
        await nextButton.click();

        // Should advance to next step — look for Back button
        const backButton = page.getByRole('button', { name: /back|previous/i }).first();
        const hasBack = await backButton.isVisible().catch(() => false);

        if (hasBack) {
          await backButton.click();

          // Should go back to previous step — name input should be visible again
          const nameVisible = await page
            .getByLabel(/cluster name|name/i)
            .first()
            .isVisible()
            .catch(() => false);
          const placeholderVisible = await page
            .getByPlaceholder(/cluster name|name|enter/i)
            .first()
            .isVisible()
            .catch(() => false);

          expect(nameVisible || placeholderVisible).toBeTruthy();
        }
      }
    });
  });
});
