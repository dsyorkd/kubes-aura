import { test, expect } from '../setup/fixtures';
import AxeBuilder from '@axe-core/playwright';
import { setupDefaultApiMocks, navigateTo, waitForLoadingComplete } from '../utils/helpers';

test.describe('Accessibility', () => {
  test.describe('Dashboard Page', () => {
    test('should not have any automatically detectable accessibility issues', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Nodes Page', () => {
    test('should not have any automatically detectable accessibility issues', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Clusters Page', () => {
    test('should not have any automatically detectable accessibility issues', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Settings Page', () => {
    test('should not have any automatically detectable accessibility issues', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('sidebar links are reachable via keyboard', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');

      // Tab through the page and check that sidebar links receive focus
      await page.keyboard.press('Tab');

      // Keep tabbing until we reach a sidebar link (up to 20 tabs)
      let foundSidebarLink = false;
      for (let i = 0; i < 20; i++) {
        const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
        const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
        if (focusedRole === 'link' || focusedTag === 'a') {
          foundSidebarLink = true;
          break;
        }
        await page.keyboard.press('Tab');
      }

      expect(foundSidebarLink).toBeTruthy();
    });

    test('interactive elements have visible focus indicators', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      // Tab to the first interactive element
      await page.keyboard.press('Tab');

      // Check that the focused element has a visible outline or ring
      const hasFocusStyle = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const styles = window.getComputedStyle(el);
        const hasOutline = styles.outlineStyle !== 'none' && styles.outlineWidth !== '0px';
        const hasBoxShadow = styles.boxShadow !== 'none';
        return hasOutline || hasBoxShadow;
      });

      expect(hasFocusStyle).toBeTruthy();
    });
  });

  test.describe('ARIA Landmarks', () => {
    test('page has a main landmark', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();
    });

    test('page has a navigation landmark', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
    });
  });
});
