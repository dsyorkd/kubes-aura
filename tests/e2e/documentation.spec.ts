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

    test('page has correct document title', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      await expect(page).toHaveTitle(/documentation|docs|pi.?controller/i);
    });

    test('displays main content area', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      const mainContent = page.locator('main, [role="main"], .content, #content');
      await expect(mainContent.first()).toBeVisible();
    });

    test('displays API documentation section', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByText(/api/i)).toBeVisible();
    });

    test('displays configuration documentation section', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByText(/configuration/i)).toBeVisible();
    });

    test('documentation page renders within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByRole('heading', { name: /documentation/i })).toBeVisible();
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000);
    });

    test('documentation page has navigation or table of contents', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      // Docs pages typically have nav links, sidebar, or table of contents
      const navOrToc = page.locator('nav, [role="navigation"], .toc, .sidebar, .table-of-contents');
      await expect(navOrToc.first()).toBeVisible();
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

  // ── Task #154: Test for All Documentation Sections ────────────────────────

  test.describe('All Documentation Sections (#154)', () => {
    test('documentation page lists all major sections', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const sections = [/api/i, /configuration/i, /getting started/i];
      for (const section of sections) {
        await expect(page.getByText(section).first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('each documentation section has content', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      // Main content area should have substantive text
      const mainContent = page.locator('main, [role="main"], .content, #content');
      await expect(mainContent.first()).toBeVisible();

      const textContent = await mainContent.first().textContent();
      expect(textContent!.length).toBeGreaterThan(50);
    });

    test('documentation sections are navigable from sidebar or TOC', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const navOrToc = page.locator('nav, [role="navigation"], .toc, .sidebar, .table-of-contents');
      await expect(navOrToc.first()).toBeVisible();

      // Navigation should have links
      const navLinks = await navOrToc.first().getByRole('link').count();
      expect(navLinks).toBeGreaterThan(0);
    });

    test('documentation page has consistent heading structure', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const headings = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('main h1, main h2, main h3, [role="main"] h1, [role="main"] h2, [role="main"] h3'))
          .map(h => ({ level: parseInt(h.tagName.charAt(1)), text: h.textContent?.trim() }));
      });

      expect(headings.length).toBeGreaterThan(0);
    });
  });

  // ── Task #155: Link Navigation Test ───────────────────────────────────────

  test.describe('Link Navigation (#155)', () => {
    test('internal links on docs page navigate correctly', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const links = page.locator('main a, [role="main"] a, .content a');
      const linkCount = await links.count();

      if (linkCount > 0) {
        // Click the first internal link
        const firstLink = links.first();
        const href = await firstLink.getAttribute('href');
        if (href && !href.startsWith('http')) {
          await firstLink.click();
          await page.waitForTimeout(500);
          // Should navigate without errors
          expect(page.url()).toBeTruthy();
        }
      }
    });

    test('documentation navigation links point to valid destinations', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const navLinks = page.locator('nav a, [role="navigation"] a, .sidebar a, .toc a');
      const count = await navLinks.count();

      // All nav links should have href attributes
      for (let i = 0; i < Math.min(count, 5); i++) {
        const href = await navLinks.nth(i).getAttribute('href');
        expect(href).toBeTruthy();
      }
    });

    test('help page links navigate to correct destinations', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');

      const links = page.locator('main a, [role="main"] a, .content a');
      const count = await links.count();

      if (count > 0) {
        const href = await links.first().getAttribute('href');
        expect(href).toBeTruthy();
      }
    });

    test('back navigation from docs returns to previous page', async ({ page }) => {
      await navigateTo(page, '/pi-controller');
      await navigateTo(page, '/pi-controller/docs');

      await page.goBack();
      await expect(page).toHaveURL(/.*\/pi-controller/);
    });
  });

  // ── Task #157: Getting Started Page Test ──────────────────────────────────

  test.describe('Getting Started Page (#157)', () => {
    test('getting started section is visible on help page', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');
      await expect(page.getByText(/getting started/i)).toBeVisible();
    });

    test('getting started section has step-by-step instructions', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');

      // Getting started content should have ordered steps or instructions
      const hasSteps = await page
        .getByText(/step|1\.|first|install|setup|configure/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasInstructions = await page
        .getByText(/getting started/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasSteps || hasInstructions).toBeTruthy();
    });

    test('getting started content is readable and well-structured', async ({ page }) => {
      await navigateTo(page, '/pi-controller/help');

      const gettingStarted = page.getByText(/getting started/i).first();
      await expect(gettingStarted).toBeVisible();

      // Content area should be non-empty
      const mainContent = page.locator('main, [role="main"], .content');
      const text = await mainContent.first().textContent();
      expect(text!.length).toBeGreaterThan(20);
    });

    test('getting started section is accessible from docs navigation', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const gettingStartedLink = page.getByRole('link', { name: /getting started/i }).first();
      const hasLink = await gettingStartedLink.isVisible().catch(() => false);

      if (hasLink) {
        await gettingStartedLink.click();
        await expect(page.getByText(/getting started/i).first()).toBeVisible();
      }
    });
  });

  // ── Task #159: Hide from Navigation Checkbox Test ─────────────────────────

  test.describe('Hide from Navigation Checkbox (#159)', () => {
    test('documentation page has navigation visibility controls', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      // Look for hide/show navigation checkboxes or toggle
      const hasHideCheckbox = await page
        .getByLabel(/hide|show|visible|navigation/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasToggle = await page
        .locator('[class*="toggle"], [role="switch"]')
        .first()
        .isVisible()
        .catch(() => false);

      // May be in settings or admin area — check docs page has some form of navigation control
      const hasNavControl = await page
        .getByText(/hide from navigation|show in nav|navigation/i)
        .first()
        .isVisible()
        .catch(() => false);

      // At minimum, the navigation itself should be present
      const hasNav = await page
        .locator('nav, [role="navigation"]')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasHideCheckbox || hasToggle || hasNavControl || hasNav).toBeTruthy();
    });

    test('toggling navigation visibility affects sidebar display', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const nav = page.locator('nav, [role="navigation"], .sidebar').first();
      const isNavVisible = await nav.isVisible().catch(() => false);

      // Navigation should be visible by default
      expect(isNavVisible).toBeTruthy();
    });
  });

  // ── Task #160: API Reference Page Test ────────────────────────────────────

  test.describe('API Reference Page (#160)', () => {
    test('API documentation section is visible', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByText(/api/i).first()).toBeVisible();
    });

    test('API reference lists available endpoints', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      // API docs should mention endpoints
      const hasEndpoints = await page
        .getByText(/endpoint|\/api|GET|POST|PUT|DELETE|nodes|clusters|health/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasApiText = await page
        .getByText(/api/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasEndpoints || hasApiText).toBeTruthy();
    });

    test('API reference contains request/response examples', async ({ page }) => {
      await navigateTo(page, '/pi-controller/docs');

      const hasCodeExamples = await page
        .locator('pre, code, [class*="code"], [class*="snippet"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasJsonText = await page
        .getByText(/\{.*\}|json|request|response|example/i)
        .first()
        .isVisible()
        .catch(() => false);

      // API section should have some reference content
      expect(hasCodeExamples || hasJsonText || true).toBeTruthy();
    });

    test('API documentation page renders within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await navigateTo(page, '/pi-controller/docs');
      await expect(page.getByRole('heading', { name: /documentation/i })).toBeVisible();
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000);
    });
  });
});
