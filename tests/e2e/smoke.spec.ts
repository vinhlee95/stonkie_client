import { test, expect } from '@playwright/test'

/**
 * Smoke test: Verify homepage loads and critical UI elements exist
 * Ported from .claude/e2e-helpers.js smoke command
 */
test('homepage loads successfully', async ({ page }) => {
  await page.goto('/')

  // Wait for page to be fully loaded (networkidle equivalent)
  await page.waitForLoadState('networkidle')

  // Verify critical homepage controls render.
  await expect(page.getByRole('tablist', { name: /market filter/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'All Sectors' })).toBeVisible()
  await expect(page.locator('a[href^="/tickers/"]:visible').first()).toBeVisible()

  // Take screenshot for verification
  await page.screenshot({ path: 'test-results/smoke-test.png', fullPage: true })
})
