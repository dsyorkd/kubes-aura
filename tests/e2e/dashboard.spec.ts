import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, navigateTo } from '../utils/helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultApiMocks(page);
  });

  test('renders page heading and subtitle', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    await expect(page.getByText('Overview of your Raspberry Pi infrastructure')).toBeVisible();
  });

  test('displays four stats cards with mocked data', async ({ page }) => {
    await navigateTo(page, '/pi-controller');

    // Wait for mock data to render (skeletons replaced by computed values)
    await expect(page.getByText('3 online, 2 offline')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('All types')).toBeVisible();
    await expect(page.getByText('46%')).toBeVisible();
    await expect(page.getByText('Normal range')).toBeVisible();
  });

  test('displays Refresh button', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('displays Quick Actions with navigation links', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByRole('button', { name: /view all clusters/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /hardware control/i })).toBeVisible();
  });

  test('displays node list when nodes are present', async ({ page }) => {
    await navigateTo(page, '/pi-controller');

    // Wait for node data to load from mocks
    await expect(page.getByText('pi-master-01')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('pi-worker-01')).toBeVisible();
    await expect(page.getByText('192.168.1.100')).toBeVisible();
  });

  test('displays System Health card with mocked health data', async ({ page }) => {
    await navigateTo(page, '/pi-controller');

    // Wait for health data to load from mocks
    await expect(page.getByText('System Health')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('healthy')).toBeVisible();
    await expect(page.getByText('v1.0.0')).toBeVisible();
  });

  test('navigates to clusters page via Quick Actions', async ({ page }) => {
    await navigateTo(page, '/pi-controller');
    await page.getByRole('button', { name: /view all clusters/i }).click();
    await expect(page).toHaveURL(/.*\/clusters/);
  });
});
