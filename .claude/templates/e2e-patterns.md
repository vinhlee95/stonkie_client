# E2E Testing Patterns

## Overview

E2E testing uses **Playwright Test** (standard TypeScript tests) via npm scripts. Tests are centrally managed in `tests/e2e/` directory.

**⚠️ Deprecated:** The old `.claude/e2e-helpers.js` Puppeteer CLI is deprecated. Use npm scripts instead.

## Available Commands

### Smoke Test (Homepage)

```bash
npm run e2e:smoke
```

- Navigates to `/` (localhost:3000)
- Verifies critical UI elements exist
- Takes screenshot on failure: `test-results/smoke-test.png`

### Run Full E2E Suite

```bash
npm run e2e
```

Runs all E2E tests:

- `tests/e2e/smoke.spec.ts` - Homepage smoke test
- `tests/e2e/console.spec.ts` - Console error checks
- `tests/e2e/industry-filter.spec.ts` - Sector filter functionality

### Run Specific Test File

```bash
npm run e2e tests/e2e/console.spec.ts
npm run e2e tests/e2e/industry-filter.spec.ts
```

### Interactive UI Mode

```bash
npm run e2e:ui
```

Opens Playwright UI for debugging and test development.

## Feature Verification Workflow

### 1. Startup Smoke Test

```bash
# Start dev server (Playwright config can auto-start it)
npm run dev

# Run smoke test (in another terminal, or Playwright will start server automatically)
npm run e2e:smoke
```

**Note:** Playwright config includes `webServer` that can auto-start the dev server. For manual control, start `npm run dev` separately.

### 2. During Development

Add new test cases to `tests/e2e/` as you build features:

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test('my feature works', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.locator('[data-testid="my-element"]')).toBeVisible()
})
```

### 3. Final Verification

Run E2E tests before committing:

```bash
# Fast smoke test (always run)
npm run e2e:smoke

# Full suite (if feature touches user flows)
npm run e2e
```

For custom verification steps, add them as new test files in `tests/e2e/`.

## Success Criteria Schema

Add to `features.json` verification section:

```json
"verification": {
  "method": "e2e",
  "steps": [
    "Run: npm run e2e:smoke",
    "If feature touches UI/routing: npm run e2e",
    "Review test results in test-results/ if failures occur"
  ]
}
```

For custom verification, add test files to `tests/e2e/` and reference them:

```json
"verification": {
  "method": "e2e",
  "testFiles": [
    "tests/e2e/smoke.spec.ts",
    "tests/e2e/my-feature.spec.ts"
  ],
  "steps": [
    "npm run e2e tests/e2e/my-feature.spec.ts"
  ]
}
```

## Common Selectors

### CSS Selectors

- `h1` - Heading
- `.class-name` - Class
- `#id-name` - ID
- `button[type="submit"]` - Attribute
- `.parent .child` - Descendant
- `.class1.class2` - Multiple classes

### Tailwind Components

Look for semantic classes or test IDs:

```javascript
// Add test IDs in code
;<button data-testid="submit-btn">Submit</button>

// Verify with selector
;('[data-testid="submit-btn"]')
```

## Test Artifacts Location

- Screenshots (on failure): `test-results/` (gitignored)
- HTML reports: `playwright-report/` (gitignored)
- Traces (on retry): `test-results/` (gitignored)

## Troubleshooting

**Dev server not ready:**

Playwright config includes `webServer` that auto-starts the dev server. If you need manual control:

```bash
# Start dev server manually
npm run dev

# In another terminal, run tests
npm run e2e:smoke
```

**Element not found:**

- Use Playwright UI mode: `npm run e2e:ui` to debug interactively
- Verify selector with browser DevTools
- Check if element loads async (use `waitForLoadState` or `waitForSelector`)
- Use `data-testid` attributes for reliable selection
- Check `test-results/` for screenshots on failure

**Console errors from backend:**

- Expected if backend not running (ERR_CONNECTION_REFUSED)
- Focus on frontend JS errors, not network errors
- Console error tests in `tests/e2e/console.spec.ts` can be adjusted to allowlist known errors

## Integration with Session Workflow

### Session Startup (Phase 1)

```bash
# Playwright can auto-start dev server, or start manually:
npm run dev

# Run smoke test
npm run e2e:smoke
```

### During Development (Phase 2)

Add test cases as you build:

```typescript
// tests/e2e/my-feature.spec.ts
test('feature milestone 1', async ({ page }) => {
  await page.goto('/my-page')
  // Assert milestone reached
})
```

### Session Completion (Phase 3)

```bash
# Run E2E verification
npm run e2e:smoke  # Always run
npm run e2e         # If feature touches user flows
```

## Migration from Old Helper

The old `.claude/e2e-helpers.js` commands map to Playwright tests:

| Old Command                                             | New Command                                     |
| ------------------------------------------------------- | ----------------------------------------------- |
| `node .claude/e2e-helpers.js smoke`                     | `npm run e2e:smoke`                             |
| `node .claude/e2e-helpers.js console <url>`             | `npm run e2e tests/e2e/console.spec.ts`         |
| `node .claude/e2e-helpers.js verify <url> <sel> [text]` | Add test case to `tests/e2e/*.spec.ts`          |
| `node .claude/e2e-helpers.js testIndustryFilter`        | `npm run e2e tests/e2e/industry-filter.spec.ts` |

## Future Enhancements

- Add more test coverage for critical user flows
- Add responsive testing (mobile/tablet viewports) via Playwright device emulation
- Add visual regression testing
- Add performance testing
- CI integration (run `npm run e2e` on PRs)
