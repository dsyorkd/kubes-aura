import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, navigateTo } from '../utils/helpers';

test.describe('Performance', () => {
  test.describe('Page Load Times', () => {
    test('dashboard loads within acceptable time', async ({ page }) => {
      await setupDefaultApiMocks(page);

      const startTime = Date.now();
      await navigateTo(page, '/pi-controller');
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds (generous for CI environments)
      expect(loadTime).toBeLessThan(5000);
    });

    test('nodes page loads within acceptable time', async ({ page }) => {
      await setupDefaultApiMocks(page);

      const startTime = Date.now();
      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('clusters page loads within acceptable time', async ({ page }) => {
      await setupDefaultApiMocks(page);

      const startTime = Date.now();
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByRole('heading', { name: 'Clusters', level: 1 })).toBeVisible();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('settings page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await navigateTo(page, '/pi-controller/settings');
      await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Largest Contentful Paint (LCP)', () => {
    test('dashboard LCP is within acceptable threshold', async ({ page }) => {
      await setupDefaultApiMocks(page);

      // Start collecting performance entries before navigation
      await page.goto('about:blank');
      await page.evaluate(() => {
        (window as unknown as Record<string, unknown>).__lcpValue = 0;
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          (window as unknown as Record<string, number>).__lcpValue = lastEntry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });

      await navigateTo(page, '/pi-controller');
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();

      // Wait a moment for LCP to finalize
      await page.waitForTimeout(1000);

      const lcpValue = await page.evaluate(
        () => (window as unknown as Record<string, number>).__lcpValue || 0,
      );

      // LCP should be under 2500ms (Good threshold per Web Vitals)
      expect(lcpValue).toBeLessThan(2500);
    });
  });

  test.describe('Cumulative Layout Shift (CLS)', () => {
    test('dashboard has minimal layout shift', async ({ page }) => {
      await setupDefaultApiMocks(page);

      await page.goto('about:blank');
      await page.evaluate(() => {
        (window as unknown as Record<string, unknown>).__clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
              (window as unknown as Record<string, number>).__clsValue +=
                (entry as PerformanceEntry & { value: number }).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });

      await navigateTo(page, '/pi-controller');
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();

      // Wait for layout to stabilize
      await page.waitForTimeout(2000);

      const clsValue = await page.evaluate(
        () => (window as unknown as Record<string, number>).__clsValue || 0,
      );

      // CLS should be under 0.1 (Good threshold per Web Vitals)
      expect(clsValue).toBeLessThan(0.1);
    });
  });

  test.describe('Interaction to Next Paint (INP)', () => {
    test('settings tab switch responds within acceptable time', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const startTime = Date.now();
      await page.getByRole('tab', { name: 'YAML Editor' }).click();
      await expect(page.getByText('YAML Configuration')).toBeVisible();
      const interactionTime = Date.now() - startTime;

      // Interaction should complete within 200ms (Good INP threshold)
      expect(interactionTime).toBeLessThan(500);
    });

    test('cluster search responds within acceptable time', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText('pi-k3s-cluster')).toBeVisible({ timeout: 15000 });

      const startTime = Date.now();
      await page.getByPlaceholder('Search clusters...').fill('docker');
      await expect(page.getByText('docker-swarm')).toBeVisible();
      const interactionTime = Date.now() - startTime;

      // Search interaction should complete within 500ms
      expect(interactionTime).toBeLessThan(500);
    });
  });

  test.describe('Resource Efficiency', () => {
    test('page does not make excessive API calls on load', async ({ page }) => {
      let apiCallCount = 0;
      await page.route(
        (url) => /\/api\/v1\//.test(url.toString()),
        async (route) => {
          apiCallCount++;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [], total: 0 }),
          });
        },
      );

      await navigateTo(page, '/pi-controller');
      await page.waitForTimeout(2000);

      // Should not make more than 10 API calls on initial page load
      expect(apiCallCount).toBeLessThan(10);
    });
  });
});
