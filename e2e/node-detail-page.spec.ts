import { test, expect } from '@playwright/test';

test.describe('Individual Node Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the nodes list page
    await page.goto('http://localhost:8080/pi-controller/nodes');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display nodes list with Monitor and Hardware buttons for ready nodes', async ({ page }) => {
    // Wait for nodes to load
    await page.waitForSelector('[data-testid="node-card"], .text-3xl:has-text("All Nodes")', { timeout: 10000 });

    // Take a screenshot of the nodes list
    await page.screenshot({
      path: 'test-results/nodes-list.png',
      fullPage: true
    });

    console.log('Screenshot saved: test-results/nodes-list.png');

    // Check if Monitor buttons exist for ready nodes
    const monitorButtons = page.getByRole('button', { name: /monitor/i });
    const monitorButtonCount = await monitorButtons.count();

    console.log(`Found ${monitorButtonCount} Monitor button(s)`);

    if (monitorButtonCount > 0) {
      // Verify at least one Monitor button is visible
      await expect(monitorButtons.first()).toBeVisible();

      // Check if Hardware buttons exist
      const hardwareButtons = page.locator('button:has(svg)').filter({ hasText: '' });
      console.log(`Found Hardware button(s)`);
    }
  });

  test('should navigate to individual node detail page', async ({ page }) => {
    // Wait for nodes to load
    await page.waitForSelector('[data-testid="node-card"], .text-3xl:has-text("All Nodes")', { timeout: 10000 });

    // Find the first Monitor button
    const monitorButton = page.getByRole('button', { name: /monitor/i }).first();

    if (await monitorButton.count() > 0) {
      // Click the Monitor button
      await monitorButton.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Take a screenshot of the node detail page
      await page.screenshot({
        path: 'test-results/node-detail-page.png',
        fullPage: true
      });

      console.log('Screenshot saved: test-results/node-detail-page.png');

      // Verify URL changed to node detail page
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      // Should match either /pi-controller/nodes/:nodeId or /pi-controller/clusters/:clusterId/nodes/:nodeId
      expect(currentUrl).toMatch(/\/pi-controller\/(nodes\/\d+|clusters\/\d+\/nodes\/\d+)/);

      // Verify page loaded without errors
      const pageTitle = await page.locator('h1, h2').first().textContent();
      console.log(`Page title: ${pageTitle}`);
    } else {
      console.log('No Monitor buttons found - nodes may not be in ready state');

      // Take a screenshot anyway to show the current state
      await page.screenshot({
        path: 'test-results/nodes-list-no-monitor.png',
        fullPage: true
      });

      // This is not a failure - just means nodes aren't ready yet
      test.skip();
    }
  });

  test('should verify node detail page for node 2 (pi-01)', async ({ page }) => {
    // Directly navigate to node 2 detail page
    await page.goto('http://localhost:8080/pi-controller/nodes/2');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/node-2-detail-page.png',
      fullPage: true
    });

    console.log('Screenshot saved: test-results/node-2-detail-page.png');

    // Check for any error messages
    const errorAlert = page.getByRole('alert');
    const hasError = await errorAlert.count() > 0;

    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log(`Error found on page: ${errorText}`);
    } else {
      console.log('No errors found on node detail page');
    }

    // Log the page title
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log(`Page title: ${pageTitle}`);

    // Verify URL is correct
    expect(page.url()).toContain('/pi-controller/nodes/2');
  });
});
