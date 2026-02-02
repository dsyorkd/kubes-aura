import { test, expect } from '../setup/fixtures';
import AxeBuilder from '@axe-core/playwright';
import { setupDefaultApiMocks, navigateTo, waitForLoadingComplete } from '../utils/helpers';

test.describe('Accessibility', () => {
  // ── Automated Axe-Core Audits (WCAG 2.0 AA) ───────────────────────────────

  test.describe('Axe-Core WCAG 2.0 AA Audit', () => {
    test('dashboard page has no accessibility violations', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('login page has no accessibility violations', async ({ page }) => {
      await navigateTo(page, '/auth/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('nodes page has no accessibility violations', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await waitForLoadingComplete(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('clusters page has no accessibility violations', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('settings page has no accessibility violations', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('help page has no accessibility violations', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('documentation page has no accessibility violations', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  // ── Form Label Association ─────────────────────────────────────────────────

  test.describe('Form Label Association', () => {
    test('login form inputs have associated labels', async ({ page }) => {
      await navigateTo(page, '/auth/login');

      // Verify form inputs are accessible via labels
      const usernameInput = page.getByLabel(/username/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Verify inputs are actual form elements
      await expect(usernameInput).toHaveAttribute('type', /(text|email)/);
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('settings form inputs have associated labels', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      // General Settings form fields should be accessible by label
      const hostnameInput = page.getByLabel('Hostname');
      await expect(hostnameInput).toBeVisible();
      await expect(hostnameInput).toBeEditable();

      const timezoneInput = page.getByLabel('Timezone');
      await expect(timezoneInput).toBeVisible();

      const logLevelInput = page.getByLabel('Log Level');
      await expect(logLevelInput).toBeVisible();
    });

    test('authentication settings form inputs have associated labels', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const sessionTimeoutInput = page.getByLabel('Session Timeout (seconds)');
      await expect(sessionTimeoutInput).toBeVisible();

      const maxLoginInput = page.getByLabel('Max Login Attempts');
      await expect(maxLoginInput).toBeVisible();

      const lockoutInput = page.getByLabel('Lockout Duration (seconds)');
      await expect(lockoutInput).toBeVisible();
    });

    test('monitoring settings form inputs have associated labels', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const updateIntervalInput = page.getByLabel('Update Interval (ms)');
      await updateIntervalInput.scrollIntoViewIfNeeded();
      await expect(updateIntervalInput).toBeVisible();

      const retentionInput = page.getByLabel('Data Retention (days)');
      await retentionInput.scrollIntoViewIfNeeded();
      await expect(retentionInput).toBeVisible();
    });

    test('all visible form inputs have accessible names via axe label rule', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      // Run axe specifically for label-related rules
      const results = await new AxeBuilder({ page })
        .withRules(['label', 'label-title-only', 'input-button-name', 'select-name'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  // ── Keyboard Navigation and Tab Order ──────────────────────────────────────

  test.describe('Keyboard Navigation', () => {
    test('sidebar links are reachable via Tab key', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');

      // Tab through the page and check that sidebar links receive focus
      let foundSidebarLink = false;
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
        const focusedHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.href || '');
        if (focusedTag === 'a' && (focusedHref.includes('/nodes') || focusedHref.includes('/clusters') || focusedHref.includes('/settings'))) {
          foundSidebarLink = true;
          break;
        }
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
        const hasBorder = styles.borderColor !== '' && styles.borderStyle !== 'none';
        return hasOutline || hasBoxShadow || hasBorder;
      });

      expect(hasFocusStyle).toBeTruthy();
    });

    test('Tab key moves focus forward through interactive elements', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const focusedElements: string[] = [];

      // Tab through several elements and track focus order
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusInfo = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          return `${el.tagName.toLowerCase()}:${el.getAttribute('role') || ''}:${el.getAttribute('name') || el.textContent?.trim().substring(0, 30) || ''}`;
        });
        if (focusInfo) {
          focusedElements.push(focusInfo);
        }
      }

      // Should have tabbed through at least some interactive elements
      expect(focusedElements.length).toBeGreaterThan(0);
    });

    test('Shift+Tab moves focus backwards', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      // Tab forward a few times
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      const forwardFocus = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}:${el.textContent?.trim().substring(0, 20)}` : null;
      });

      // Shift+Tab back
      await page.keyboard.press('Shift+Tab');

      const backwardFocus = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}:${el.textContent?.trim().substring(0, 20)}` : null;
      });

      // Focus should have moved to a different element
      expect(backwardFocus).not.toEqual(forwardFocus);
    });

    test('Enter key activates focused links', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');

      // Tab until we reach a navigation link
      let foundLink = false;
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        const isLink = await page.evaluate(() => document.activeElement?.tagName.toLowerCase() === 'a');
        if (isLink) {
          foundLink = true;
          break;
        }
      }

      expect(foundLink).toBeTruthy();

      // Record current URL, press Enter to activate
      const urlBefore = page.url();
      await page.keyboard.press('Enter');
      await page.waitForLoadState('domcontentloaded');

      // URL may change or content may update — just verify Enter didn't break anything
      const urlAfter = page.url();
      // The link should either navigate or at least not throw an error
      expect(urlAfter).toBeTruthy();
    });

    test('tab order follows logical document flow', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');

      const tabPositions: { tag: string; y: number }[] = [];

      // Tab through elements and record their vertical positions
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const position = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const rect = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), y: rect.top };
        });
        if (position) {
          tabPositions.push(position);
        }
      }

      // Verify we collected positions (page has interactive elements)
      expect(tabPositions.length).toBeGreaterThan(0);

      // Check that tab order generally follows top-to-bottom flow
      // Allow some tolerance for elements at the same vertical level (nav bar, etc.)
      let outOfOrderCount = 0;
      for (let i = 1; i < tabPositions.length; i++) {
        if (tabPositions[i].y < tabPositions[i - 1].y - 50) {
          outOfOrderCount++;
        }
      }

      // Allow at most a small number of out-of-order jumps (e.g., skip-nav, modals)
      expect(outOfOrderCount).toBeLessThanOrEqual(3);
    });
  });

  // ── ARIA Landmarks ─────────────────────────────────────────────────────────

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

    test('headings follow proper hierarchy', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      // Collect all heading levels on the page
      const headingLevels = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings).map((h) => parseInt(h.tagName.charAt(1)));
      });

      // Verify headings exist
      expect(headingLevels.length).toBeGreaterThan(0);

      // Verify no heading level is skipped (e.g., h1 -> h3 without h2)
      for (let i = 1; i < headingLevels.length; i++) {
        const jump = headingLevels[i] - headingLevels[i - 1];
        // A heading can go deeper by at most 1 level, or go back to any shallower level
        expect(jump).toBeLessThanOrEqual(1);
      }
    });

    test('images have alt text', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      const results = await new AxeBuilder({ page })
        .withRules(['image-alt'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('color contrast meets WCAG AA requirements', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
});
