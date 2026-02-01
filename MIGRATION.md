# Test Directory Migration Guide

## Overview

The Playwright test directory structure has been reorganized to follow best practices and the project PRD specifications.

## Changes

### Old Structure
```
web/kubes-aura/
├── e2e/
│   ├── api-integration.spec.ts
│   ├── node-detail-debug.spec.ts
│   └── node-detail-page.spec.ts
└── playwright.config.ts
```

### New Structure
```
web/kubes-aura/
├── tests/
│   ├── setup/           # Test fixtures and configuration
│   │   └── fixtures.ts
│   ├── utils/           # Helper functions
│   ├── e2e/             # End-to-end tests (move existing tests here)
│   └── README.md
└── playwright.config.ts (updated)
```

## Migration Steps

1. **Move existing test files**:
   ```bash
   mv e2e/*.spec.ts tests/e2e/
   ```

2. **Update import paths** in test files:
   - Change relative paths to account for new directory depth
   - Import custom fixtures: `import { test, expect } from '../setup/fixtures';`

3. **Remove old e2e directory**:
   ```bash
   rmdir e2e
   ```

4. **Verify tests still run**:
   ```bash
   npm test
   ```

## Configuration Updates

The `playwright.config.ts` has been updated with:

- ✅ `testDir: './tests'` (changed from `'./e2e'`)
- ✅ `fullyParallel: true` (improved performance)
- ✅ Multiple reporters (HTML, JSON, JUnit)
- ✅ Cross-browser support (Chromium, Firefox, WebKit)
- ✅ Mobile viewport testing
- ✅ Enhanced failure capture (screenshots, videos, traces)

## Breaking Changes

**None** - The configuration is backward compatible. Tests in the old `e2e/` directory will not be discovered until moved to `tests/e2e/`.

## Next Steps

After migration:
1. Update test files to use custom fixtures from `tests/setup/fixtures.ts`
2. Create helper utilities in `tests/utils/`
3. Add mock data in `tests/setup/test-data.ts`
4. Implement authentication fixture for `authenticatedPage`

## Verification

Run these commands to verify the setup:

```bash
# Check Playwright installation
npx playwright --version

# List test files (should be empty until migration)
npx playwright test --list

# Run tests (will show no tests found until migration)
npm test
```
