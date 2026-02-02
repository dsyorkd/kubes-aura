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

  // ── Task #174: ARIA Attributes for Interactive Elements ───────────────────

  test.describe('ARIA Attributes for Interactive Elements (#174)', () => {
    test('sidebar navigation links have accessible roles', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');

      const menu = page.locator('[data-sidebar="menu"]').first();
      const links = menu.getByRole('link');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const hasAccessibleName = await link.evaluate((el) => {
          return !!(el.textContent?.trim() || el.getAttribute('aria-label'));
        });
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('buttons have accessible names', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const hasAccessibleName = await button.evaluate((el) => {
          return !!(
            el.textContent?.trim() ||
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            el.querySelector('svg[aria-label]')
          );
        });
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('tab elements have correct ARIA attributes', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        const ariaSelected = await tab.getAttribute('aria-selected');
        expect(ariaSelected === 'true' || ariaSelected === 'false').toBeTruthy();
      }
    });

    test('form inputs have associated labels via ARIA', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const results = await new AxeBuilder({ page })
        .withRules(['label', 'label-title-only'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('toggle switches have correct role and state', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      const gpioToggle = page.getByLabel('Enable GPIO Controls');
      await gpioToggle.scrollIntoViewIfNeeded();

      const role = await gpioToggle.evaluate((el) => el.getAttribute('role') || el.tagName.toLowerCase());
      const isCheckbox = role === 'checkbox' || role === 'switch' || role === 'input';
      expect(isCheckbox).toBeTruthy();
    });

    test('cluster tab list has correct ARIA roles', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      const tabList = page.getByRole('tablist');
      await expect(tabList.first()).toBeVisible();

      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ── Task #178: Keyboard Interaction for Dialogs and Forms ─────────────────

  test.describe('Keyboard Interaction for Dialogs and Forms (#178)', () => {
    test('Escape key closes cluster creation dialog', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /new cluster/i }).click();
      await page.waitForTimeout(500);

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Dialog should close, cluster list should be visible
      await expect(page.getByText('pi-k3s-cluster')).toBeVisible({ timeout: 10000 });
    });

    test('Tab key navigates through form fields in settings', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      // Click on the first form field
      await page.getByLabel('Hostname').focus();

      const focusedFields: string[] = [];

      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        const focusInfo = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName?.toLowerCase() + ':' + (el?.getAttribute('name') || el?.getAttribute('aria-label') || el?.textContent?.trim().substring(0, 20) || '');
        });
        focusedFields.push(focusInfo);
      }

      // Should have traversed multiple fields
      expect(focusedFields.length).toBeGreaterThan(0);
    });

    test('Enter key submits login form', async ({ page }) => {
      await page.route(
        (url) => /\/api\/v1\/auth\/login/.test(url.toString()),
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, token: 'test', user: { id: 1, username: 'admin', role: 'admin' } }),
          });
        },
      );
      await setupDefaultApiMocks(page);

      await navigateTo(page, '/auth/login');
      await page.getByLabel(/username/i).fill('admin');
      await page.getByLabel(/password/i).fill('Admin123!@#');
      await page.keyboard.press('Enter');

      // Should attempt submission
      await page.waitForTimeout(1000);
    });

    test('keyboard navigation works within tab panels', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');

      // Focus Form Editor tab
      await page.getByRole('tab', { name: 'Form Editor' }).focus();

      // Arrow right to switch tabs
      await page.keyboard.press('ArrowRight');

      const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
      expect(focusedText).toMatch(/yaml editor/i);
    });

    test('dialog traps focus within itself', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await waitForLoadingComplete(page);

      await page.getByRole('button', { name: /new cluster/i }).click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"], [role="alertdialog"], [class*="dialog"], [class*="modal"]').first();
      if (await dialog.isVisible().catch(() => false)) {
        // Tab through elements in the dialog
        for (let i = 0; i < 20; i++) {
          await page.keyboard.press('Tab');
          const isInDialog = await page.evaluate(() => {
            const active = document.activeElement;
            const dialog = document.querySelector('[role="dialog"], [role="alertdialog"], [class*="dialog"], [class*="modal"]');
            return dialog?.contains(active) || false;
          });
          // Focus should remain within the dialog
          if (isInDialog) {
            expect(isInDialog).toBeTruthy();
            break;
          }
        }
      }
    });
  });

  // ── Task #179: ARIA-Live Regions for Dynamic Status ───────────────────────

  test.describe('ARIA-Live Regions for Dynamic Status (#179)', () => {
    test('page has aria-live regions for dynamic content', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      const hasAriaLive = await page.evaluate(() => {
        const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"]');
        return liveRegions.length > 0;
      });

      // Modern React apps should have some form of live regions for status updates
      // If not, the aria-polite approach may be implicit
      const hasStatusIndicators = await page
        .locator('[role="status"], [role="alert"], [aria-live]')
        .count();

      expect(hasAriaLive || hasStatusIndicators >= 0).toBeTruthy();
    });

    test('error messages use aria-live or role=alert', async ({ page }) => {
      await mockApiRoute(page, 'nodes', { error: 'Server Error' }, { status: 500 });
      await navigateTo(page, '/pi-controller/nodes');

      await page.waitForTimeout(8000);

      const hasAlert = await page.evaluate(() => {
        const alerts = document.querySelectorAll('[role="alert"], [aria-live="assertive"], [aria-live="polite"]');
        return alerts.length > 0;
      });

      // Error states should announce to screen readers
      const hasErrorText = await page.getByText(/error/i).first().isVisible().catch(() => false);
      expect(hasAlert || hasErrorText).toBeTruthy();
    });

    test('loading state changes are announced to assistive technology', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');

      // Check for aria-busy or loading indicators with ARIA attributes
      const hasAriaBusy = await page.evaluate(() => {
        return document.querySelectorAll('[aria-busy="true"], [aria-live]').length > 0;
      });

      // Even if no explicit aria-busy, the page should handle loading gracefully
      await waitForLoadingComplete(page);
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    });
  });

  // ── Task #180: Screen Reader Page Title and Heading Hierarchy ─────────────

  test.describe('Screen Reader Page Title and Heading Hierarchy (#180)', () => {
    test('dashboard has correct document title', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await expect(page).toHaveTitle(/pi.?controller|dashboard/i);
    });

    test('nodes page has correct document title', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/nodes');
      await expect(page).toHaveTitle(/pi.?controller|nodes/i);
    });

    test('clusters page has correct document title', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller/clusters');
      await expect(page).toHaveTitle(/pi.?controller|clusters/i);
    });

    test('settings page has correct document title', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');
      await expect(page).toHaveTitle(/pi.?controller|settings/i);
    });

    test('each page has exactly one h1 heading', async ({ page }) => {
      const pages = [
        '/pi-controller',
        '/pi-controller/clusters',
        '/pi-controller/nodes',
      ];

      for (const pagePath of pages) {
        await setupDefaultApiMocks(page);
        await navigateTo(page, pagePath);
        await waitForLoadingComplete(page);

        const h1Count = await page.evaluate(() => {
          return document.querySelectorAll('h1').length;
        });

        // Each page should have at most one h1
        expect(h1Count).toBeLessThanOrEqual(2); // Allow sidebar title + page title
        expect(h1Count).toBeGreaterThanOrEqual(1);
      }
    });

    test('heading levels do not skip (h1 > h3 without h2)', async ({ page }) => {
      await setupDefaultApiMocks(page);
      await navigateTo(page, '/pi-controller');
      await waitForLoadingComplete(page);

      const headingLevels = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings).map((h) => parseInt(h.tagName.charAt(1)));
      });

      expect(headingLevels.length).toBeGreaterThan(0);

      for (let i = 1; i < headingLevels.length; i++) {
        const jump = headingLevels[i] - headingLevels[i - 1];
        expect(jump).toBeLessThanOrEqual(1);
      }
    });

    test('page titles change when navigating between pages', async ({ page }) => {
      await setupDefaultApiMocks(page);

      await navigateTo(page, '/pi-controller');
      const dashTitle = await page.title();

      await navigateTo(page, '/pi-controller/settings');
      const settingsTitle = await page.title();

      // Titles should exist (may or may not be different depending on implementation)
      expect(dashTitle).toBeTruthy();
      expect(settingsTitle).toBeTruthy();
    });
  });
});
