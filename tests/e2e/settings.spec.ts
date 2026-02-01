import { test, expect } from '../setup/fixtures';
import { navigateTo, injectAuthState } from '../utils/helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthState(page);
  });

  test('renders page heading and subtitle', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();
    await expect(page.getByText('Configure Pi Controller system parameters')).toBeVisible();
  });

  test('displays Form Editor and YAML Editor tabs', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    await expect(page.getByRole('tab', { name: 'Form Editor' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'YAML Editor' })).toBeVisible();
  });

  test('displays General Settings section with fields', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    await expect(page.getByText('General Settings')).toBeVisible();
    await expect(page.getByText('Hostname')).toBeVisible();
    await expect(page.getByText('Timezone')).toBeVisible();
    await expect(page.getByText('Log Level')).toBeVisible();
  });

  test('displays Authentication section with fields', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    await expect(page.getByText('Authentication')).toBeVisible();
    await expect(page.getByText('Session Timeout (seconds)')).toBeVisible();
    await expect(page.getByText('Max Login Attempts')).toBeVisible();
    await expect(page.getByText('Lockout Duration (seconds)')).toBeVisible();
  });

  test('displays GPIO Controls section', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    const gpioHeading = page.getByText('GPIO Controls').first();
    await gpioHeading.scrollIntoViewIfNeeded();
    await expect(gpioHeading).toBeVisible();
    await expect(page.getByText('Enable GPIO Controls')).toBeVisible();
  });

  test('displays Monitoring section', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    const monitoringHeading = page.getByText('Monitoring').first();
    await monitoringHeading.scrollIntoViewIfNeeded();
    await expect(monitoringHeading).toBeVisible();
    await expect(page.getByText('Update Interval (ms)')).toBeVisible();
    await expect(page.getByText('Data Retention (days)')).toBeVisible();
    await expect(page.getByText('Enable Alerts')).toBeVisible();
  });

  test('displays Cluster Management section', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    const clusterHeading = page.getByText('Cluster Management').first();
    await clusterHeading.scrollIntoViewIfNeeded();
    await expect(clusterHeading).toBeVisible();
    await expect(page.getByText('Auto Discovery')).toBeVisible();
    await expect(page.getByText('Health Check Interval (ms)')).toBeVisible();
    await expect(page.getByText('Auto Failover')).toBeVisible();
  });

  test('displays Export YAML and Import YAML buttons', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    // Buttons are at the top of the page
    await expect(page.getByText('Export YAML')).toBeVisible();
    await expect(page.getByText('Import YAML')).toBeVisible();
  });

  test('displays Save Configuration button', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    const saveBtn = page.getByText('Save Configuration');
    await saveBtn.scrollIntoViewIfNeeded();
    await expect(saveBtn).toBeVisible();
  });

  test('has default values in form fields', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    // Use label association to find the hostname input
    const hostnameInput = page.getByLabel('Hostname');
    await expect(hostnameInput).toHaveValue('pi-controller');
  });

  test('switches to YAML Editor tab', async ({ page }) => {
    await navigateTo(page, '/pi-controller/settings');

    await page.getByRole('tab', { name: 'YAML Editor' }).click();
    await expect(page.getByText('YAML Configuration')).toBeVisible();
  });
});
