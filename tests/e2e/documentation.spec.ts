import { test, expect } from '../setup/fixtures';
import { navigateTo } from '../utils/helpers';

test.describe('Documentation and Help Pages', () => {
  test.describe('help page', () => {
    test('renders help page heading', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');
      await expect(page.getByRole('heading', { name: /help/i })).toBeVisible();
    });

    test('displays help categories or sections', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');
      await expect(page.getByText(/getting started/i)).toBeVisible();
    });

    test('displays search functionality for help content', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe('documentation page', () => {
    test('renders documentation page heading', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByRole('heading', { name: /documentation/i })).toBeVisible();
    });

    test('displays API documentation section', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByText(/api/i)).toBeVisible();
    });

    test('displays configuration documentation section', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByText(/configuration/i)).toBeVisible();
    });
  });

  test.describe('footer links', () => {
    test('help link in footer navigates to help page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await page.getByText('Help').click();
      await expect(page).toHaveURL(/.*\/(help|docs)/);
    });

    test('documentation link in footer navigates to docs page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await page.getByText('Documentation').click();
      await expect(page).toHaveURL(/.*\/(docs|documentation)/);
    });
  });
});
