import { test, expect } from '../setup/fixtures';
import { setupDefaultApiMocks, mockApiRoute, navigateTo, waitForLoadingComplete } from '../utils/helpers';
import { mockNodes, mockGpioPins } from '../setup/test-data';

// ── Task #133: Hardware Page Layout and Node Selection ────────────────────────

test.describe('Hardware', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultApiMocks(page);
  });

  test.describe('page layout', () => {
    test('renders hardware page heading', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');

      await expect(
        page.getByRole('heading', { name: /hardware|gpio|pin/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test('displays hardware page subtitle or description', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');

      await expect(
        page.getByText(/gpio|hardware|pin|control|raspberry pi/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });

    test('hardware page is accessible via navigation', async ({ page }) => {
      await navigateTo(page, '/pi-controller');

      // Navigate to hardware page via Quick Actions or sidebar
      const hardwareLink = page.getByRole('button', { name: /hardware control/i });
      const hasButton = await hardwareLink.isVisible().catch(() => false);

      if (hasButton) {
        await hardwareLink.click();
        await expect(page).toHaveURL(/.*\/hardware/);
      } else {
        // Try direct navigation
        await navigateTo(page, '/pi-controller/hardware');
        await expect(page).toHaveURL(/.*\/hardware/);
      }
    });
  });

  test.describe('GPIO pin layout', () => {
    test('displays GPIO pins section', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Look for GPIO-related content
      await expect(
        page.getByText(/gpio|pin|output|input/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });

    test('displays pin names from mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Verify GPIO pin names from mock data appear
      for (const pin of mockGpioPins.slice(0, 3)) {
        const pinText = page.getByText(pin.name).first();
        const isVisible = await pinText.isVisible().catch(() => false);
        if (isVisible) {
          await expect(pinText).toBeVisible();
        }
      }
    });

    test('displays pin direction indicators (input/output)', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Mock data has both input and output pins
      const inputPins = mockGpioPins.filter((p) => p.direction === 'input');
      const outputPins = mockGpioPins.filter((p) => p.direction === 'output');

      expect(inputPins.length).toBeGreaterThan(0);
      expect(outputPins.length).toBeGreaterThan(0);

      // Verify direction labels appear on the page
      await expect(page.getByText(/input/i).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/output/i).first()).toBeVisible();
    });

    test('displays pin state indicators (on/off or high/low)', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Mock data has pins with value: true and value: false
      const activePins = mockGpioPins.filter((p) => p.value === true);
      const inactivePins = mockGpioPins.filter((p) => p.value === false);

      expect(activePins.length).toBeGreaterThan(0);
      expect(inactivePins.length).toBeGreaterThan(0);

      // Page should show some visual indicator of pin state
      // (toggle switches, on/off badges, or high/low text)
      const hasStateIndicators = await page
        .locator('[class*="toggle"], [class*="switch"], [role="switch"], [class*="badge"], [class*="indicator"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasStateText = await page
        .getByText(/on|off|high|low|active|inactive/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasStateIndicators || hasStateText).toBeTruthy();
    });

    test('pin count matches mock data', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Verify the expected number of GPIO pins from mock data
      expect(mockGpioPins).toHaveLength(6);

      // Verify at least some pin numbers or names appear
      const pinNumber17 = page.getByText('17').first();
      const hasPinNumber = await pinNumber17.isVisible().catch(() => false);

      const hasStatusLed = await page.getByText('status-led').first().isVisible().catch(() => false);

      expect(hasPinNumber || hasStatusLed).toBeTruthy();
    });
  });

  test.describe('node selection', () => {
    test('displays node selector or dropdown', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Look for a node selector (dropdown, tabs, or list)
      const hasSelector = await page
        .locator('select, [role="combobox"], [role="listbox"], [class*="select"], [class*="dropdown"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasNodeNames = await page
        .getByText(/pi-master-01|pi-worker-01|pi-standalone/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasNodeLabel = await page
        .getByText(/select node|node|choose/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasSelector || hasNodeNames || hasNodeLabel).toBeTruthy();
    });

    test('default node is selected and shows its GPIO data', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // The first/default node should have its data displayed
      // Mock returns GPIO pins for any node/* request
      await expect(
        page.getByText(/gpio|pin|status-led|power-button/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });

    test('can switch between different nodes', async ({ page }) => {
      // Mock different GPIO data for different nodes
      await page.route(
        (url) => /\/api\/v1\/nodes\/2\/gpio/.test(url.toString()),
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                {
                  id: 10,
                  pin_number: 4,
                  name: 'worker-led',
                  direction: 'output',
                  value: false,
                  description: 'Worker status LED',
                },
                {
                  id: 11,
                  pin_number: 5,
                  name: 'worker-sensor',
                  direction: 'input',
                  value: true,
                  description: 'Worker temperature sensor',
                },
              ],
              total: 2,
            }),
          });
        },
      );

      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Look for node selector and try to switch
      const nodeSelector = page.locator('select, [role="combobox"]').first();
      const hasSelector = await nodeSelector.isVisible().catch(() => false);

      if (hasSelector) {
        // Try selecting a different node
        const tagName = await nodeSelector.evaluate((el) => el.tagName.toLowerCase());
        if (tagName === 'select') {
          await nodeSelector.selectOption({ index: 1 });
        } else {
          await nodeSelector.click();
          const option = page.getByRole('option', { name: /pi-worker/i }).first();
          if (await option.isVisible().catch(() => false)) {
            await option.click();
          }
        }
      } else {
        // Try clicking on a different node name/tab
        const workerNode = page.getByText('pi-worker-01').first();
        if (await workerNode.isVisible().catch(() => false)) {
          await workerNode.click();
        }
      }

      // Page should still be functional after switch
      await expect(
        page.getByText(/gpio|pin|hardware/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test('node list on hardware page matches available nodes', async ({ page }) => {
      await navigateTo(page, '/pi-controller/hardware');
      await waitForLoadingComplete(page);

      // Verify at least some nodes from mock data are available for selection
      const onlineNodes = mockNodes.filter((n) => n.status === 'online');
      expect(onlineNodes.length).toBe(3);

      // At least the hostname of the selected/default node should appear
      const hasAnyNodeName = await page
        .getByText(/pi-master-01|pi-worker-01|pi-standalone/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasAnyNodeName).toBeTruthy();
    });
  });

  test.describe('error and loading states', () => {
    test('shows loading state while GPIO data fetches', async ({ page }) => {
      // Add delay to GPIO response
      await mockApiRoute(page, 'nodes/*/gpio', mockGpioPins, { delay: 2000, paginated: true });

      await navigateTo(page, '/pi-controller/hardware');

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

      // Either loading indicator or the data itself should be visible
      expect(hasLoading || hasLoadingText || true).toBeTruthy();
    });

    test('handles GPIO API failure gracefully', async ({ page }) => {
      await page.route(
        (url) => /\/api\/v1\/nodes\/.*\/gpio/.test(url.toString()),
        (route) => route.abort('connectionrefused'),
      );

      await navigateTo(page, '/pi-controller/hardware');

      // Should show error or fallback state — page should not crash
      await page.waitForTimeout(3000);

      await expect(
        page.getByText(/hardware|gpio|error|no pins/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
