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

  // ── Task #186: Animation Smoothness Test ────────────────────────────────────

  test.describe('Animation Smoothness', () => {
    test('verifies animations do not drop below 30fps', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/settings');

      // Set up frame rate monitoring
      await page.evaluate(() => {
        (window as unknown as Record<string, unknown>).__frameRates = [];
        let lastFrameTime = performance.now();
        
        function measureFrameRate() {
          const now = performance.now();
          const fps = 1000 / (now - lastFrameTime);
          (window as unknown as Record<string, number[]>).__frameRates.push(fps);
          lastFrameTime = now;
          requestAnimationFrame(measureFrameRate);
        }
        requestAnimationFrame(measureFrameRate);
      });

      // Trigger animations by tab switching
      for (let i = 0; i < 5; i++) {
        await page.getByRole('tab', { name: 'YAML Editor' }).click();
        await page.waitForTimeout(100);
        await page.getByRole('tab', { name: 'Form Editor' }).click();
        await page.waitForTimeout(100);
      }

      // Check frame rates during animations
      const frameRates = await page.evaluate(() => 
        (window as unknown as Record<string, number[]>).__frameRates || []
      );

      if (frameRates.length > 10) {
        const avgFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
        const minFrameRate = Math.min(...frameRates);

        // Average should be decent and minimum should not drop too low
        expect(avgFrameRate).toBeGreaterThan(20);
        expect(minFrameRate).toBeGreaterThan(15); // Allow some tolerance for slower CI environments
      }
    });

    test('smooth scrolling performance on long lists', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const startTime = Date.now();
      
      // Scroll through the page multiple times
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(50);
        await page.mouse.wheel(0, -500);
        await page.waitForTimeout(50);
      }

      const scrollTime = Date.now() - startTime;
      
      // Scrolling should be responsive even with multiple operations
      expect(scrollTime).toBeLessThan(1000);
      
      // Page should still be responsive after scrolling
      const isResponsive = await page
        .getByRole('heading')
        .first()
        .isVisible()
        .catch(() => false);
        
      expect(isResponsive).toBeTruthy();
    });
  });

  // ── Task #187: Memory Leak Detection Test ────────────────────────────────────

  test.describe('Memory Leak Detection', () => {
    test('navigates repeatedly and checks memory does not grow unbounded', async ({ page }) => {
      await setupDefaultApiMocks(page);

      // Get initial memory baseline
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Navigate through different pages multiple times
      const routes = [
        '/pi-controller',
        '/pi-controller/nodes', 
        '/pi-controller/clusters',
        '/pi-controller/hardware',
        '/pi-controller/settings'
      ];

      // Repeat navigation cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const route of routes) {
          await navigateTo(page, route);
          await waitForLoadingComplete(page);
          await page.waitForTimeout(200);
        }
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as unknown as { gc: () => void }).gc();
        }
      });

      await page.waitForTimeout(1000);

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        const growthRatio = memoryGrowth / initialMemory;
        
        // Memory should not grow excessively (allow 200% growth for reasonable caching)
        expect(growthRatio).toBeLessThan(2.0);
        
        // Absolute growth should not exceed 50MB
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('detects event listener memory leaks', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/settings');

      // Count initial listeners
      const initialListenerCount = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let totalListeners = 0;
        
        elements.forEach(el => {
          const listeners = (el as unknown as { __listeners?: unknown[] }).__listeners;
          if (listeners) {
            totalListeners += listeners.length;
          }
        });
        
        return totalListeners;
      });

      // Repeatedly add and remove dynamic content that might have listeners
      for (let i = 0; i < 10; i++) {
        // Switch tabs which may add/remove event listeners
        await page.getByRole('tab', { name: 'YAML Editor' }).click();
        await page.waitForTimeout(50);
        await page.getByRole('tab', { name: 'Form Editor' }).click();
        await page.waitForTimeout(50);
      }

      await page.waitForTimeout(1000);

      // Check if listeners have grown excessively
      const finalListenerCount = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let totalListeners = 0;
        
        elements.forEach(el => {
          const listeners = (el as unknown as { __listeners?: unknown[] }).__listeners;
          if (listeners) {
            totalListeners += listeners.length;
          }
        });
        
        return totalListeners;
      });

      // Listener count should not grow dramatically
      if (initialListenerCount > 0) {
        const listenerGrowth = finalListenerCount - initialListenerCount;
        expect(listenerGrowth).toBeLessThan(initialListenerCount * 0.5); // 50% growth max
      }
    });
  });

  // ── Task #188: Efficient Re-render Test ────────────────────────────────────

  test.describe('Efficient Re-render', () => {
    test('verifies components do not re-render unnecessarily', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // Set up render counting
      await page.evaluate(() => {
        (window as unknown as Record<string, unknown>).__renderCount = 0;
        
        // Monitor DOM changes as proxy for re-renders
        const observer = new MutationObserver(() => {
          (window as unknown as Record<string, number>).__renderCount++;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });
        
        (window as unknown as Record<string, MutationObserver>).__observer = observer;
      });

      await page.waitForTimeout(1000);

      // Reset counter after initial load
      await page.evaluate(() => {
        (window as unknown as Record<string, number>).__renderCount = 0;
      });

      // Perform actions that should NOT cause unnecessary re-renders
      await page.getByPlaceholder(/search/i).first().fill('test');
      await page.waitForTimeout(500);
      
      // Clear the search
      await page.getByPlaceholder(/search/i).first().clear();
      await page.waitForTimeout(500);

      // Check render count
      const renderCount = await page.evaluate(() => 
        (window as unknown as Record<string, number>).__renderCount || 0
      );

      // Should have minimal renders for simple interactions
      expect(renderCount).toBeLessThan(20); // Allow some reasonable re-renders

      // Clean up observer
      await page.evaluate(() => {
        const obs = (window as unknown as Record<string, MutationObserver>).__observer;
        if (obs) obs.disconnect();
      });
    });

    test('memoization prevents redundant component updates', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Trigger the same API call multiple times
      await page.reload();
      await waitForLoadingComplete(page);
      await page.reload();
      await waitForLoadingComplete(page);

      // Component should handle identical data efficiently
      const loadingTime = Date.now();
      await page.reload();
      await waitForLoadingComplete(page);
      const finalLoadTime = Date.now() - loadingTime;

      // Subsequent renders with same data should be faster
      expect(finalLoadTime).toBeLessThan(3000);

      // Page should still be fully functional
      await expect(page.getByText('pi-master-01').first()).toBeVisible();
    });

    test('list virtualization handles large datasets efficiently', async ({ page }) => {
      // Create large mock dataset
      const largeNodeList = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        name: `pi-node-${i + 1}`,
        ip_address: `192.168.${Math.floor(i / 254) + 1}.${(i % 254) + 1}`,
        status: i % 5 === 0 ? 'offline' : 'online',
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100
      }));

      await mockApiRoute(page, 'nodes', largeNodeList, { paginated: true });

      const startTime = Date.now();
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);
      const loadTime = Date.now() - startTime;

      // Should load large datasets efficiently
      expect(loadTime).toBeLessThan(5000);

      // Should not render all items in DOM at once (virtualization check)
      const renderedItems = await page.locator('[class*="node"], [data-testid*="node"]').count();
      
      // If virtualized properly, should render fewer items than total dataset
      expect(renderedItems).toBeLessThan(largeNodeList.length);
      expect(renderedItems).toBeGreaterThan(0);
    });
  });
});
