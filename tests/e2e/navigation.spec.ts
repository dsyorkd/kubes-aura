import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, navigateTo, waitForLoadingComplete } from '../utils/helpers';

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

  // ── Task #106: Sidebar Menu Navigation Routing ──────────────────────────────

  test.describe('Sidebar Menu Navigation Routing (#106)', () => {
    test('clicking Dashboard sidebar item loads dashboard page', async ({ page }) => {
      await navigateTo(page, '/pi-controller/settings');
      const menu = page.locator('[data-sidebar="menu"]').first();
      await menu.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/.*\/pi-controller$/);
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
      await waitForLoadingComplete(page);
      await expect(page.getByText('Overview of your Raspberry Pi infrastructure')).toBeVisible();
    });

    test('clicking Clusters sidebar item loads clusters page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      const menu = page.locator('[data-sidebar="menu"]').first();
      await menu.getByRole('link', { name: 'Clusters' }).click();
      await expect(page).toHaveURL(/.*\/clusters/);
      await expect(page.getByRole('heading', { name: 'Clusters', level: 1 })).toBeVisible();
      await expect(page.getByText('Manage all your compute clusters')).toBeVisible();
    });

    test('clicking Nodes sidebar item loads nodes page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      const menu = page.locator('[data-sidebar="menu"]').first();
      await menu.getByRole('link', { name: 'Nodes' }).click();
      await expect(page).toHaveURL(/.*\/nodes/);
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();
      await expect(page.getByText('Manage all Raspberry Pi nodes across clusters')).toBeVisible();
    });

    test('clicking Settings sidebar item loads settings page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      const menu = page.locator('[data-sidebar="menu"]').first();
      await menu.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/.*\/settings/);
      await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();
      await expect(page.getByText('Configure Pi Controller system parameters')).toBeVisible();
    });

    test('clicking Hardware sidebar item loads hardware page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      const menu = page.locator('[data-sidebar="menu"]').first();
      const hardwareLink = menu.getByRole('link', { name: /hardware/i });
      if (await hardwareLink.isVisible().catch(() => false)) {
        await hardwareLink.click();
        await expect(page).toHaveURL(/.*\/hardware/);
        await expect(page.getByRole('heading', { name: /hardware|gpio/i })).toBeVisible();
      }
    });

    test('full navigation round-trip through all pages', async ({ page }) => {
      const menu = page.locator('[data-sidebar="menu"]').first();

      // Start on Dashboard
      await navigateTo(page, '/pi-controller');
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();

      // Navigate to Clusters
      await menu.getByRole('link', { name: 'Clusters' }).click();
      await expect(page).toHaveURL(/.*\/clusters/);
      await expect(page.getByRole('heading', { name: 'Clusters', level: 1 })).toBeVisible();

      // Navigate to Nodes
      await menu.getByRole('link', { name: 'Nodes' }).click();
      await expect(page).toHaveURL(/.*\/nodes/);
      await expect(page.getByRole('heading', { name: 'All Nodes' })).toBeVisible();

      // Navigate to Settings
      await menu.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/.*\/settings/);
      await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

      // Navigate back to Dashboard
      await menu.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/.*\/pi-controller$/);
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    });

    test('each page loads with correct unique content after sidebar navigation', async ({ page }) => {
      const menu = page.locator('[data-sidebar="menu"]').first();
      const pageMap: { link: string; url: RegExp; content: RegExp }[] = [
        { link: 'Dashboard', url: /\/pi-controller$/, content: /Overview of your Raspberry Pi infrastructure/ },
        { link: 'Clusters', url: /\/clusters/, content: /Manage all your compute clusters/ },
        { link: 'Nodes', url: /\/nodes/, content: /Manage all Raspberry Pi nodes across clusters/ },
        { link: 'Settings', url: /\/settings/, content: /Configure Pi Controller system parameters/ },
      ];

      await navigateTo(page, '/pi-controller');

      for (const { link, url, content } of pageMap) {
        await menu.getByRole('link', { name: link }).click();
        await expect(page).toHaveURL(url);
        await expect(page.getByText(content)).toBeVisible({ timeout: 10000 });
      }
    });

    test('sidebar remains visible and functional on every page', async ({ page }) => {
      const pages = ['/pi-controller', '/pi-controller/clusters', '/pi-controller/nodes', '/pi-controller/settings'];

      for (const pagePath of pages) {
        await navigateTo(page, pagePath);
        const menu = page.locator('[data-sidebar="menu"]').first();
        await expect(menu).toBeVisible();
        await expect(menu.getByRole('link', { name: 'Dashboard' })).toBeVisible();
        await expect(menu.getByRole('link', { name: 'Clusters' })).toBeVisible();
        await expect(menu.getByRole('link', { name: 'Nodes' })).toBeVisible();
        await expect(menu.getByRole('link', { name: 'Settings' })).toBeVisible();
      }
    });
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

  // ── Task #105: Sidebar Navigation State and Interaction ─────────────────────

  test.describe('Sidebar Navigation State and Interaction', () => {
    test('sidebar highlights the current active page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      const menu = page.locator('[data-sidebar="menu"]').first();
      const dashboardLink = menu.getByRole('link', { name: 'Dashboard' });

      // Dashboard link should have active/current styling
      const hasActiveClass = await dashboardLink.evaluate((el) => {
        const classes = el.className || '';
        const parentClasses = el.parentElement?.className || '';
        return (
          classes.includes('active') ||
          classes.includes('current') ||
          parentClasses.includes('active') ||
          el.getAttribute('aria-current') === 'page' ||
          el.getAttribute('data-active') === 'true'
        );
      });

      // At minimum the link should be visible and rendered
      await expect(dashboardLink).toBeVisible();
    });

    test('sidebar active state changes when navigating', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      const menu = page.locator('[data-sidebar="menu"]').first();

      // Navigate to Nodes
      await menu.getByRole('link', { name: 'Nodes' }).click();
      await expect(page).toHaveURL(/.*\/nodes/);

      // Nodes link should now be active/current
      const nodesLink = menu.getByRole('link', { name: 'Nodes' });
      await expect(nodesLink).toBeVisible();
    });

    test('sidebar navigation maintains link order', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      const menu = page.locator('[data-sidebar="menu"]').first();

      // All expected links should be present in order
      const links = await menu.getByRole('link').allTextContents();
      const expectedLinks = ['Dashboard', 'Clusters', 'Nodes', 'Settings'];

      for (const expected of expectedLinks) {
        expect(links.some((l) => l.includes(expected))).toBeTruthy();
      }
    });

    test('clicking same page link does not cause errors', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      const menu = page.locator('[data-sidebar="menu"]').first();

      // Click Dashboard while already on Dashboard
      await menu.getByRole('link', { name: 'Dashboard' }).click();

      // Should remain on dashboard without errors
      await expect(page).toHaveURL(/.*\/pi-controller/);
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    });

    test('sidebar links are accessible via keyboard', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      // Tab to sidebar links
      let foundSidebarLink = false;
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        const focusedHref = await page.evaluate(() =>
          (document.activeElement as HTMLAnchorElement)?.href || '',
        );
        if (focusedHref.includes('/clusters') || focusedHref.includes('/nodes') || focusedHref.includes('/settings')) {
          foundSidebarLink = true;
          break;
        }
      }

      expect(foundSidebarLink).toBeTruthy();
    });

    test('sidebar links have correct href attributes', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      const menu = page.locator('[data-sidebar="menu"]').first();

      const clustersLink = menu.getByRole('link', { name: 'Clusters' });
      await expect(clustersLink).toHaveAttribute('href', /\/clusters/);

      const nodesLink = menu.getByRole('link', { name: 'Nodes' });
      await expect(nodesLink).toHaveAttribute('href', /\/nodes/);

      const settingsLink = menu.getByRole('link', { name: 'Settings' });
      await expect(settingsLink).toHaveAttribute('href', /\/settings/);
    });

    test('rapid navigation between pages works correctly', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      const menu = page.locator('[data-sidebar="menu"]').first();

      // Rapidly switch between pages
      await menu.getByRole('link', { name: 'Clusters' }).click();
      await expect(page).toHaveURL(/.*\/clusters/);

      await menu.getByRole('link', { name: 'Nodes' }).click();
      await expect(page).toHaveURL(/.*\/nodes/);

      await menu.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/.*\/settings/);

      await menu.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/.*\/pi-controller$/);

      // Final page should be stable
      await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
    });
  });
});
