import { test, expect } from '@playwright/test'

/**
 * Smoke test: Verify homepage loads and critical UI elements exist
 * Ported from .claude/e2e-helpers.js smoke command
 */
test('homepage loads successfully', async ({ page }) => {
  await page.goto('/')

  // Wait for page to be fully loaded (networkidle equivalent)
  await page.waitForLoadState('networkidle')

  // Verify critical UI element exists (h1 with "Market Overview")
  const heading = page.locator('h1').first()
  await expect(heading).toBeVisible()
  await expect(heading).toContainText('Market Overview')

  // Take screenshot for verification
  await page.screenshot({ path: 'test-results/smoke-test.png', fullPage: true })
})
