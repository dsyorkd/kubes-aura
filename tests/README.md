# Playwright E2E Test Suite

This directory contains end-to-end tests for the Pi-Controller Web UI (kubes-aura).

## Directory Structure

```
tests/
├── setup/          # Test fixtures, custom test utilities, and configuration
│   └── fixtures.ts # Custom Playwright fixtures for authenticated pages and mock data
├── utils/          # Helper functions and utilities for tests
├── e2e/            # End-to-end test files
└── README.md       # This file
```

## Running Tests

```bash
# Run all tests (headless)
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Configuration

Tests are configured via `playwright.config.ts` in the project root with:

- **Test Directory**: `./tests`
- **Parallel Execution**: Enabled for faster test runs
- **Browsers**: Chromium, Firefox, WebKit (+ mobile viewports)
- **Reporters**: HTML, JSON, JUnit
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: Captured on failure
- **Video**: Recorded on failure
- **Traces**: Captured on first retry

## Writing Tests

Import the custom test fixtures:

```typescript
import { test, expect } from './setup/fixtures';

test('example test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pi Controller/);
});
```

### Available Fixtures

- `authenticatedPage`: Pre-authenticated page session (TODO: implement)
- `mockNodes`: Array of mock node data (TODO: implement)
- `mockClusters`: Array of mock cluster data (TODO: implement)

## Test Data

Mock data and test fixtures will be defined in:
- `tests/setup/test-data.ts` (planned)
- `tests/setup/fixtures.ts` (created)

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to `develop` and `main` branches
- Pull requests targeting `develop` and `main`

Test results are uploaded as artifacts and can be viewed in the GitHub Actions UI.

## Notes

- The dev server starts automatically when tests run
- Tests use `http://localhost:8080` as the base URL
- Existing tests from the old `e2e/` directory should be migrated to `tests/e2e/`
