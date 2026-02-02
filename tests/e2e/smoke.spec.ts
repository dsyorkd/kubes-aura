import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, navigateTo, waitForLoadingComplete } from '../utils/helpers';

// ── Task #90: Write Initial E2E Test to Validate Infrastructure ─────────────

test.describe('Smoke Test - Infrastructure Validation', () => {
  test('validates Playwright + mocks + fixtures all work together', async ({ page }) => {
    // Test that our testing infrastructure works end-to-end
    await setupDefaultApiMocks(page);
    
    // Navigate to the main dashboard
    await navigateTo(page, '/pi-controller');
    
    // Wait for loading to complete
    await waitForLoadingComplete(page);
    
    // Verify basic page structure is rendered
    await expect(page.getByRole('heading', { name: /pi controller/i })).toBeVisible();
    
    // Verify mocked API data is displayed (proves API mocking works)
    await expect(page.getByText('pi-master-01')).toBeVisible();
    
    // Verify interactive elements are working
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    }
    
    // Verify navigation works
    await navigateTo(page, '/pi-controller/nodes');
    await expect(page.getByRole('heading', { name: /nodes/i })).toBeVisible();
    
    // Verify test fixtures are working properly  
    await expect(page.getByText('pi-worker-01')).toBeVisible();
  });

  test('validates basic error handling works', async ({ page }) => {
    // Test API error scenarios
    await page.route(
      (url) => /\/api\/v1\/nodes/.test(url.toString()),
      (route) => route.abort('connectionrefused')
    );
    
    await navigateTo(page, '/pi-controller/nodes');
    
    // Should show some error state or retry mechanism
    const hasErrorState = await page
      .getByText(/error|retry|failed|unavailable/i)
      .first()
      .isVisible()
      .catch(() => false);
      
    expect(hasErrorState).toBeTruthy();
  });

  test('validates responsive design basics work', async ({ page }) => {
    await setupDefaultApiMocks(page);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo(page, '/pi-controller');
    await waitForLoadingComplete(page);
    
    // Page should still render properly on mobile
    await expect(page.getByRole('heading', { name: /pi controller/i })).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateTo(page, '/pi-controller');
    await waitForLoadingComplete(page);
    
    // Page should still render properly on desktop
    await expect(page.getByRole('heading', { name: /pi controller/i })).toBeVisible();
  });
});