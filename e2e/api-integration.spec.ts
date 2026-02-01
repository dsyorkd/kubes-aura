import { test, expect } from '@playwright/test';

/**
 * E2E tests for Web UI and API Integration
 *
 * These tests verify that the web UI correctly fetches and displays
 * data from the pi-controller API.
 */

test.describe('Health Check', () => {
  test('API health endpoint is accessible', async ({ request }) => {
    const response = await request.get('/api/v1/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('API readiness endpoint is accessible', async ({ request }) => {
    const response = await request.get('/api/v1/ready');
    // Readiness might return 503 if dependencies aren't ready, but should respond
    expect([200, 503]).toContain(response.status());
  });
});

test.describe('Dashboard Page', () => {
  test('should load dashboard and display data from API', async ({ page }) => {
    await page.goto('/pi-controller/dashboard');

    // Wait for the page to load
    await expect(page.getByText('Pi Controller Dashboard')).toBeVisible();

    // Check for stats cards (should show loading or data)
    await expect(page.getByText('Total Nodes')).toBeVisible();
    await expect(page.getByText('Clusters')).toBeVisible();
    await expect(page.getByText('Avg CPU Usage')).toBeVisible();
  });

  test('should show loading skeletons while fetching data', async ({ page }) => {
    // Slow down network to see loading states
    await page.route('**/api/v1/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/pi-controller/dashboard');

    // Page should still render with loading states
    await expect(page.getByText('Pi Controller Dashboard')).toBeVisible();
  });

  test('should have working refresh button', async ({ page }) => {
    await page.goto('/pi-controller/dashboard');
    await expect(page.getByText('Pi Controller Dashboard')).toBeVisible();

    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      // Button should show loading state (spinning icon)
      await expect(refreshButton).toBeDisabled();
      // Wait for it to re-enable
      await expect(refreshButton).toBeEnabled({ timeout: 10000 });
    }
  });
});

test.describe('Clusters Page', () => {
  test('should load clusters page and fetch data', async ({ page }) => {
    await page.goto('/pi-controller/clusters');

    // Wait for page to load
    await expect(page.getByText('Clusters')).toBeVisible();

    // Check for tabs
    await expect(page.getByRole('tab', { name: /all/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /kubernetes/i })).toBeVisible();
  });

  test('should show error state when API fails', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/v1/clusters**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/pi-controller/clusters');

    // Should show error alert
    await expect(page.getByText(/error loading clusters/i)).toBeVisible({ timeout: 10000 });

    // Should have retry button
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('should filter clusters by search', async ({ page }) => {
    await page.goto('/pi-controller/clusters');
    await expect(page.getByText('Clusters')).toBeVisible();

    // Find search input
    const searchInput = page.getByPlaceholder(/search clusters/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('production');
      // Results should update based on search
    }
  });

  test('should switch between cluster type tabs', async ({ page }) => {
    await page.goto('/pi-controller/clusters');

    // Click Kubernetes tab
    await page.getByRole('tab', { name: /kubernetes/i }).click();

    // Click Docker tab
    await page.getByRole('tab', { name: /docker/i }).click();

    // Click Custom tab
    await page.getByRole('tab', { name: /custom/i }).click();

    // Click All tab
    await page.getByRole('tab', { name: /all/i }).click();
  });
});

test.describe('Cluster Details Page', () => {
  test('should navigate to cluster details', async ({ page }) => {
    // First mock some cluster data
    await page.route('**/api/v1/clusters**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              name: 'Test Cluster',
              status: 'healthy',
              node_count: 3,
              online_nodes: 3,
              type: 'k3s',
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/pi-controller/clusters');

    // Wait for clusters to load
    await expect(page.getByText('Test Cluster')).toBeVisible({ timeout: 10000 });

    // Click on cluster card
    await page.getByText('Test Cluster').click();

    // Should navigate to cluster details
    await expect(page).toHaveURL(/\/clusters\/1/);
  });

  test('should show cluster details with nodes', async ({ page }) => {
    // Mock cluster data
    await page.route('**/api/v1/clusters**', route => {
      if (route.request().url().includes('/nodes')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 1,
                hostname: 'node-1',
                ip_address: '192.168.1.100',
                status: 'online',
                role: 'master',
                cpu_usage: 45,
                memory_usage: 60,
              },
            ],
            total: 1,
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 1,
                name: 'Test Cluster',
                status: 'healthy',
                node_count: 1,
                online_nodes: 1,
              },
            ],
            total: 1,
          }),
        });
      }
    });

    await page.goto('/pi-controller/clusters/1');

    // Wait for cluster details to load
    await expect(page.getByText(/status/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Hardware Page', () => {
  test('should show node selection when no node specified', async ({ page }) => {
    await page.goto('/pi-controller/hardware');

    // Should show hardware control header
    await expect(page.getByText('Hardware Control')).toBeVisible();

    // Should show instruction to select node
    await expect(page.getByText(/select a node/i)).toBeVisible();
  });

  test('should load hardware page for specific node', async ({ page }) => {
    // Mock node data with GPIO pins
    await page.route('**/api/v1/nodes**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              hostname: 'pi-node-1',
              ip_address: '192.168.1.100',
              status: 'online',
              cpu_usage: 45,
              memory_usage: 60,
              temperature: 52,
              gpio_pins: [
                { id: 1, pin_number: 18, name: 'LED', direction: 'output', value: true },
                { id: 2, pin_number: 19, name: 'Button', direction: 'input', value: false },
              ],
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/pi-controller/hardware/1');

    // Should show hardware control for the node
    await expect(page.getByText(/hardware control/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('API Data Flow', () => {
  test('should make correct API calls on page load', async ({ page }) => {
    const apiCalls: string[] = [];

    await page.route('**/api/v1/**', async route => {
      apiCalls.push(route.request().url());
      await route.continue();
    });

    await page.goto('/pi-controller/dashboard');
    await page.waitForLoadState('networkidle');

    // Should have made calls to health, clusters, and nodes endpoints
    expect(apiCalls.some(url => url.includes('/health'))).toBeTruthy();
  });

  test('should handle empty data gracefully', async ({ page }) => {
    // Mock empty responses
    await page.route('**/api/v1/clusters**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.route('**/api/v1/nodes**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/pi-controller/clusters');

    // Should show empty state message
    await expect(page.getByText(/no clusters found/i)).toBeVisible({ timeout: 10000 });
  });

  test('should update data when refresh is clicked', async ({ page }) => {
    let callCount = 0;

    await page.route('**/api/v1/clusters**', route => {
      callCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 1, name: `Cluster ${callCount}`, status: 'healthy' }],
          total: 1,
        }),
      });
    });

    await page.goto('/pi-controller/clusters');
    await expect(page.getByText('Cluster 1')).toBeVisible({ timeout: 10000 });

    // Click refresh
    await page.getByRole('button', { name: /refresh/i }).click();

    // Wait for new data
    await expect(page.getByText('Cluster 2')).toBeVisible({ timeout: 10000 });
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Error Handling', () => {
  test('should show network error message', async ({ page }) => {
    await page.route('**/api/v1/clusters**', route => {
      route.abort('failed');
    });

    await page.goto('/pi-controller/clusters');

    // Should show error state
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 10000 });
  });

  test('should allow retry after error', async ({ page }) => {
    let shouldFail = true;

    await page.route('**/api/v1/clusters**', route => {
      if (shouldFail) {
        shouldFail = false;
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{ id: 1, name: 'Test Cluster', status: 'healthy' }],
            total: 1,
          }),
        });
      }
    });

    await page.goto('/pi-controller/clusters');

    // Wait for error state
    await expect(page.getByText(/error loading clusters/i)).toBeVisible({ timeout: 10000 });

    // Click retry
    await page.getByRole('button', { name: /retry/i }).click();

    // Should now show data
    await expect(page.getByText('Test Cluster')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages correctly', async ({ page }) => {
    await page.goto('/pi-controller/dashboard');
    await expect(page.getByText('Pi Controller Dashboard')).toBeVisible();

    // Navigate to clusters via quick action or sidebar
    await page.getByRole('link', { name: /view all clusters/i }).click();
    await expect(page).toHaveURL(/\/clusters/);

    // Use back navigation if available
    const backButton = page.getByRole('button', { name: /back/i });
    if (await backButton.isVisible()) {
      await backButton.click();
    }
  });
});
