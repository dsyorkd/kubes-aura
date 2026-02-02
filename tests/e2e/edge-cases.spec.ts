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

  // ── Task #168: Loading States Test ────────────────────────────────────────

  test.describe('Loading States (#168)', () => {
    test('dashboard shows loading indicators while fetching', async ({ page }) => {
      await mockApiRoute(page, 'nodes', [], { delay: 2000, paginated: true });
      await mockApiRoute(page, 'clusters', [], { delay: 2000, paginated: true });
      await mockApiRoute(page, 'health', { status: 'healthy' }, { delay: 2000 });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller');

      const hasSkeletons = await page
        .locator('[class*="skeleton"], [data-testid="skeleton"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasSpinners = await page
        .locator('[class*="spinner"], [role="progressbar"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasLoadingText = await page
        .getByText(/loading/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasSkeletons || hasSpinners || hasLoadingText).toBeTruthy();
    });

    test('clusters page shows loading state', async ({ page }) => {
      await mockApiRoute(page, 'clusters', [], { delay: 3000, paginated: true });
      await mockApiRoute(page, 'health', { status: 'healthy' });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller/clusters');

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

    test('loading state transitions to content after data loads', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      // After loading, actual data should be visible
      await expect(page.getByText('pi-master-01').first()).toBeVisible();
    });

    test('multiple simultaneous loading states resolve correctly', async ({ page }) => {
      await mockApiRoute(page, 'nodes', [], { delay: 1000, paginated: true });
      await mockApiRoute(page, 'clusters', [], { delay: 1500, paginated: true });
      await mockApiRoute(page, 'health', { status: 'healthy' }, { delay: 500 });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller');
      await page.waitForTimeout(3000);

      // All loading should have resolved — heading should be visible
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    });
  });

  // ── Task #169: Form Validation Messages Test ──────────────────────────────

  test.describe('Form Validation Messages (#169)', () => {
    test('login form shows validation messages for empty fields', async ({ page }) => {
      await navigateTo(page, '/auth/login');
      await page.getByRole('button', { name: /sign in/i }).click();

      const hasUsernameError = await page
        .getByText(/username is required|please enter/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasPasswordError = await page
        .getByText(/password is required|please enter/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasUsernameError || hasPasswordError).toBeTruthy();
    });

    test('registration form shows validation for password mismatch', async ({ page }) => {
      await navigateTo(page, '/auth/register');

      await page.getByLabel(/username/i).fill('testuser');
      await page.getByLabel('Password *').fill('StrongPass123!');
      await page.getByLabel('Confirm Password *').fill('Different123!');

      await expect(page.getByText(/passwords do not match|mismatch/i)).toBeVisible();
    });

    test('settings form validation prevents invalid data submission', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const hostnameInput = page.getByLabel('Hostname');
      await hostnameInput.clear();

      const saveBtn = page.getByText('Save Configuration');
      await saveBtn.scrollIntoViewIfNeeded();
      await saveBtn.click();

      // Should show error or prevent submission
      const hasError = await page
        .getByText(/required|cannot be empty|invalid/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasNativeValidation = await hostnameInput.evaluate(
        (el: HTMLInputElement) => !el.checkValidity(),
      );

      expect(hasError || hasNativeValidation).toBeTruthy();
    });

    test('validation messages disappear when errors are corrected', async ({ page }) => {
      await navigateTo(page, '/auth/register');

      await page.getByLabel('Password *').fill('StrongPass123!');
      await page.getByLabel('Confirm Password *').fill('Different123!');

      // Should show mismatch
      await expect(page.getByText(/passwords do not match|mismatch/i)).toBeVisible();

      // Fix the mismatch
      await page.getByLabel('Confirm Password *').clear();
      await page.getByLabel('Confirm Password *').fill('StrongPass123!');

      // Mismatch error should disappear or match confirmation should appear
      await expect(page.getByText(/passwords match/i)).toBeVisible({ timeout: 5000 });
    });
  });

  // ── Task #170: Empty States Test ──────────────────────────────────────────

  test.describe('Empty States (#170)', () => {
    test('nodes page shows empty state message with no data', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { data: [], total: 0 });
      await mockApiRoute(page, 'health', { status: 'healthy' });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller/nodes');
      await expect(page.getByText(/no nodes found/i)).toBeVisible({ timeout: 15000 });
    });

    test('clusters page shows empty state message with no data', async ({ page }) => {
      await mockApiRoute(page, 'clusters', [], { paginated: true });
      await mockApiRoute(page, 'health', { status: 'healthy' });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/no clusters found/i)).toBeVisible({ timeout: 15000 });
    });

    test('dashboard handles empty node data gracefully', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { data: [], total: 0 });
      await mockApiRoute(page, 'clusters', [], { paginated: true });
      await mockApiRoute(page, 'health', { status: 'healthy', version: '1.0.0' });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller');

      // Dashboard should still render with zero counts
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    });

    test('empty state provides action button to add content', async ({ page }) => {
      await mockApiRoute(page, 'clusters', [], { paginated: true });
      await mockApiRoute(page, 'health', { status: 'healthy' });
      await mockApiRoute(page, 'ready', { status: 'ready' });

      await navigateTo(page, '/pi-controller/clusters');
      await expect(page.getByText(/no clusters found/i)).toBeVisible({ timeout: 15000 });

      // Empty state should have a CTA button
      const hasCTA = await page
        .getByRole('button', { name: /new cluster|add|create/i })
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasCTA).toBeTruthy();
    });

    test('search producing no results shows appropriate message', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('zzz-nonexistent-zzz');

      // All nodes should be filtered out
      for (const node of ['pi-master-01', 'pi-worker-01', 'pi-standalone']) {
        await expect(page.getByText(node).first()).not.toBeVisible();
      }
    });
  });
});
