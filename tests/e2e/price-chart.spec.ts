import { test, expect } from '@playwright/test'

/**
 * E2E test for price chart rendering on stock and ETF pages
 * Uses mock backend server (see tests/global-setup.ts)
 *
 * Test workflow verification
 */
test.describe('Price Chart', () => {
  test('renders on stock ticker page', async ({ page }) => {
    await page.goto('/tickers/AAPL')

    // Verify price chart container renders
    // Note: TradingView widget content loads via external script, so we only check container exists
    const chartContainer = page.locator('.tradingview-widget-container')
    await expect(chartContainer).toBeVisible({ timeout: 10000 })
  })

  test('renders on ETF ticker page', async ({ page }) => {
    await page.goto('/etf/SPYY')

    // Verify price chart container renders
    // Note: TradingView widget content loads via external script, so we only check container exists
    const chartContainer = page.locator('.tradingview-widget-container')
    await expect(chartContainer).toBeVisible({ timeout: 10000 })
  })
})
