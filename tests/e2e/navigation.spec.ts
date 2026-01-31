import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, navigateTo } from '../utils/helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultApiMocks(page);
  });

  test('sidebar displays all navigation links', async ({ page }) => {
    await navigateTo(page, '/pi-controller');

    // Use data-sidebar="menu" to scope to navigation, getByRole to avoid strict mode
    const menu = page.locator('[data-sidebar="menu"]').first();
    await expect(menu.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Clusters' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Nodes' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('navigates to Clusters page from sidebar', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await page.locator('[data-sidebar="menu"]').first().getByRole('link', { name: 'Clusters' }).click();
    await expect(page).toHaveURL(/.*\/clusters/);
    await expect(page.getByRole('heading', { name: 'Clusters', level: 1 })).toBeVisible();
  });

  test('navigates to Nodes page from sidebar', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await page.locator('[data-sidebar="menu"]').first().getByRole('link', { name: 'Nodes' }).click();
    await expect(page).toHaveURL(/.*\/nodes/);
    await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();
  });

  test('navigates to Settings page from sidebar', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await page.locator('[data-sidebar="menu"]').first().getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();
  });

  test('navigates to Dashboard from sidebar', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');
    await page.locator('[data-sidebar="menu"]').first().getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/pi-controller$/);
    await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
  });

  test('displays app branding in header', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByText('Hardware & Cluster Management')).toBeVisible();
  });

  test('displays footer links', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByText('Help')).toBeVisible();
    await expect(page.getByText('Documentation')).toBeVisible();
  });
});
