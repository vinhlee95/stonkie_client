import { test, expect } from '@playwright/test'

/**
 * Console error check: Verify no JavaScript errors on page
 * Ported from .claude/e2e-helpers.js console command
 */
test('homepage has no console errors', async ({ page }) => {
  const errors: string[] = []
  const warnings: string[] = []

  // Listen for console messages
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text())
    }
  })

  // Listen for page errors
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Wait a bit for any async errors to surface
  await page.waitForTimeout(2000)

  // Log warnings but don't fail on them
  if (warnings.length > 0) {
    console.log('⚠️  Console warnings:')
    warnings.forEach((warn) => console.log(`  - ${warn}`))
  }

  // Fail if there are errors
  if (errors.length > 0) {
    console.error('✗ Console errors detected:')
    errors.forEach((err) => console.error(`  - ${err}`))
  }

  expect(errors).toHaveLength(0)
})

test('ticker page has no console errors', async ({ page }) => {
  const errors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  // Test with a common ticker (AAPL)
  await page.goto('/tickers/AAPL')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  if (errors.length > 0) {
    console.error('✗ Console errors detected:')
    errors.forEach((err) => console.error(`  - ${err}`))
  }

  expect(errors).toHaveLength(0)
})
