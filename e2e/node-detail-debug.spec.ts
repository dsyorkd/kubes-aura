import { test, expect } from '@playwright/test';

test.describe('Node Page Debug Tests', () => {
  test('should check API connectivity and console errors', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Listen for network requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push(`REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push(`RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // Navigate to the nodes list page
    await page.goto('http://localhost:8080/pi-controller/nodes');

    // Wait for network activity to settle
    await page.waitForTimeout(5000);

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/debug-nodes-list.png',
      fullPage: true
    });

    // Log all console messages
    console.log('\n=== Console Logs ===');
    consoleLogs.forEach(log => console.log(log));

    // Log all API requests
    console.log('\n=== API Requests ===');
    apiRequests.forEach(req => console.log(req));

    // Check for error elements
    const errorAlert = page.getByRole('alert');
    const errorCount = await errorAlert.count();

    if (errorCount > 0) {
      console.log('\n=== Error Messages ===');
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorAlert.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }

    // Try to directly access the API
    const apiResponse = await page.request.get('http://192.168.4.11:8080/api/nodes');
    console.log('\n=== Direct API Test ===');
    console.log(`Status: ${apiResponse.status()}`);
    console.log(`Headers: ${JSON.stringify(await apiResponse.headers())}`);

    if (apiResponse.ok()) {
      const data = await apiResponse.json();
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`Failed: ${await apiResponse.text()}`);
    }
  });

  test('should test node detail page directly', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate directly to node 2
    await page.goto('http://localhost:8080/pi-controller/nodes/2');

    // Wait for network activity to settle
    await page.waitForTimeout(5000);

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/debug-node-2.png',
      fullPage: true
    });

    // Log console messages
    console.log('\n=== Node 2 Console Logs ===');
    consoleLogs.forEach(log => console.log(log));

    // Check the page content
    const pageContent = await page.textContent('body');
    console.log('\n=== Page Content Summary ===');
    console.log(pageContent?.substring(0, 500));
  });
});
