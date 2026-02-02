import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, mockApiRoute, navigateTo, waitForLoadingComplete } from '../utils/helpers';

test.describe('Edge Cases', () => {
  test.describe('Loading States', () => {
    test('displays loading indicators while data is fetching', async ({ page }) => {
      // Add a delay to API response so we can catch loading state
      await mockApiRoute(page, 'nodes', [], { delay: 2000, paginated: true });

      await navigateTo(page, '/pi-controller/nodes');

      // Should show some loading indicator (skeleton, spinner, or text)
      const hasLoading = await page
        .locator('[class*="skeleton"], [role="progressbar"], [class*="spinner"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasLoadingText = await page
        .getByText(/loading/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasLoading || hasLoadingText).toBeTruthy();
    });

    test('loading state resolves after data loads', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // Data should be visible after loading completes
      await expect(page.getByText('pi-master-01').first()).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('settings form prevents submission with empty required fields', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      // Clear the hostname field
      const hostnameInput = page.getByLabel('Hostname');
      await hostnameInput.clear();

      // Attempt to save — scroll to and click save button
      const saveBtn = page.getByText('Save Configuration');
      await saveBtn.scrollIntoViewIfNeeded();
      await saveBtn.click();

      // Should show validation error or not submit
      const hasValidationError = await page
        .getByText(/required|cannot be empty|invalid/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasNativeValidation = await hostnameInput.evaluate(
        (el: HTMLInputElement) => !el.checkValidity(),
      );

      expect(hasValidationError || hasNativeValidation).toBeTruthy();
    });

    test('search input handles special characters gracefully', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('<script>alert("xss")</script>');

      // Should not crash; page should remain functional
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();
    });

    test('search input handles very long input', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('a'.repeat(500));

      // Should not crash; page should remain functional
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();
    });
  });

  test.describe('Empty States', () => {
    test('nodes page shows empty state with no data', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { data: [], total: 0 });

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/no nodes found/i)).toBeVisible({ timeout: 15000 });
    });

    test('clusters page shows empty state with no data', async ({ page }) => {
      await mockApiRoute(page, 'clusters', [], { paginated: true });

      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/no clusters found/i)).toBeVisible({ timeout: 15000 });
    });

    test('search with no matching results shows appropriate message', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      const searchInput = page.getByPlaceholder('Search clusters...');
      await searchInput.fill('zzz-nonexistent-cluster-zzz');

      // Should show no results or empty state
      await expect(page.getByText('pi-k3s-cluster')).not.toBeVisible();
    });
  });

  test.describe('Browser Navigation', () => {
    test('handles browser back button correctly', async ({ page }) => {
      await setupDefaultApiMocks(page);

      await navigateTo(page, '/pi-controller');
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();

      await page.goBack();
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    });

    test('handles page refresh without losing navigation state', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');

      await page.reload();
      await expect(page).toHaveURL(/.*\/clusters/);
    });
  });
});
