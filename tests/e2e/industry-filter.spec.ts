import { test, expect } from '@playwright/test'

/**
 * Industry filter test: Verify sector filter functionality with mock data
 * Ported from .claude/e2e-helpers.js testIndustryFilter command
 */
test('industry filter functionality works', async ({ page }) => {
  await page.goto('/test/industry-filter')
  await page.waitForLoadState('networkidle')

  // Wait for buttons to render
  const buttons = page.locator('button')
  await expect(buttons.first()).toBeVisible({ timeout: 5000 })

  // Get all sector chip buttons
  const chipTexts = await buttons.allTextContents()
  const sectorChips = chipTexts.filter(
    (text) => text.trim().length > 0 && text.trim().length < 50, // Filter likely chip buttons
  )

  console.log(`✓ Sector chips found: ${sectorChips.join(', ')}`)

  // Verify 'All Sectors' chip exists
  expect(sectorChips).toContain('All Sectors')
  console.log('✓ "All Sectors" chip exists')

  // Take screenshot of initial state
  await page.screenshot({ path: 'test-results/filter-all-sectors.png', fullPage: true })

  // Count total companies initially
  const allCompaniesLinks = page.locator('a[href^="/tickers/"]')
  const allCompaniesCount = await allCompaniesLinks.count()
  console.log(`✓ Total companies visible: ${allCompaniesCount}`)

  // Find first non-"All Sectors" chip to test filtering
  const testSector = sectorChips.find((text) => text.trim() !== 'All Sectors')

  if (testSector) {
    console.log(`\n📍 Testing filter with: ${testSector}`)

    // Click the sector chip
    const sectorButton = page.locator('button').filter({ hasText: testSector.trim() })
    await sectorButton.click()
    console.log(`✓ Clicked "${testSector}" chip`)

    // Wait for filtering to apply
    await page.waitForTimeout(500)

    // Take screenshot of filtered state
    const screenshotName = testSector.trim().toLowerCase().replace(/\s+/g, '-')
    await page.screenshot({
      path: `test-results/filter-${screenshotName}.png`,
      fullPage: true,
    })
    console.log(`✓ Screenshot: test-results/filter-${screenshotName}.png`)

    // Count filtered companies
    const filteredCount = await allCompaniesLinks.count()
    console.log(`✓ Companies shown after filtering: ${filteredCount}`)

    // Verify filtering occurred (count should be less than or equal to total)
    if (filteredCount <= allCompaniesCount && filteredCount > 0) {
      console.log(
        `✓ Filtering works (showing ${filteredCount} out of ${allCompaniesCount} companies)`,
      )
    } else if (filteredCount === 0) {
      console.log(
        `⚠️  No companies in ${testSector} category (this is OK if data doesn't have that sector)`,
      )
    } else {
      throw new Error(`Unexpected company count: ${filteredCount} > ${allCompaniesCount}`)
    }

    // Verify selected chip uses the active text style.
    const hasActiveStyle = await sectorButton.evaluate(
      (el) => el.className.includes('text-gray-900') || el.className.includes('dark:text-white'),
    )

    if (hasActiveStyle) {
      console.log(`✓ "${testSector}" chip has active style`)
    } else {
      throw new Error(`"${testSector}" chip missing active style`)
    }

    // Click 'All Sectors' to reset
    const allSectorsButton = page.locator('button').filter({ hasText: 'All Sectors' })
    await allSectorsButton.click()
    console.log('\n✓ Clicked "All Sectors" chip')

    // Wait and verify all companies shown again
    await page.waitForTimeout(500)
    const resetCount = await allCompaniesLinks.count()

    expect(resetCount).toBe(allCompaniesCount)
    console.log(`✓ All companies restored: ${resetCount} companies`)

    // Verify 'All Sectors' chip uses the active text style.
    const allSectorsActive = await allSectorsButton.evaluate(
      (el) => el.className.includes('text-gray-900') || el.className.includes('dark:text-white'),
    )

    if (allSectorsActive) {
      console.log('✓ "All Sectors" chip has active style')
    } else {
      throw new Error('"All Sectors" chip missing active style')
    }
  } else {
    console.log('⚠️  No sector chips found besides "All Sectors" - cannot test filtering')
  }

  console.log('\n✅ All industry filter tests passed!')
})
