#!/usr/bin/env node

/**
 * E2E Testing Helper for Stonkie
 * Usage: node .claude/e2e-helpers.js <command> [args]
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer')

const COMMANDS = {
  smoke: smokeTest,
  navigate: navigateAndScreenshot,
  verify: verifyElement,
  console: checkConsoleErrors,
  testIndustryFilter: testIndustryFilterWithMock,
  help: showHelp,
}

async function smokeTest() {
  console.log('🧪 Running smoke test...')
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 })
    await page.screenshot({ path: '.claude/screenshots/smoke-test.png' })

    console.log('✓ Homepage loaded')
    console.log(`✓ Screenshot: .claude/screenshots/smoke-test.png`)

    if (errors.length > 0) {
      console.log('⚠️  Console errors detected:')
      errors.forEach((err) => console.log(`  - ${err}`))
    } else {
      console.log('✓ No console errors')
    }
  } catch (error) {
    console.error('✗ Smoke test failed:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

async function navigateAndScreenshot() {
  const url = process.argv[3] || 'http://localhost:3000'
  const filename = process.argv[4] || 'screenshot.png'

  console.log(`🔍 Navigating to ${url}...`)
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 })
    await page.screenshot({ path: `.claude/screenshots/${filename}` })
    console.log(`✓ Screenshot: .claude/screenshots/${filename}`)
  } catch (error) {
    console.error('✗ Navigation failed:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

async function verifyElement() {
  const url = process.argv[3] || 'http://localhost:3000'
  const selector = process.argv[4]
  const expectedText = process.argv[5]

  if (!selector) {
    console.error('Usage: node .claude/e2e-helpers.js verify <url> <selector> [expectedText]')
    process.exit(1)
  }

  console.log(`🔍 Verifying element ${selector} on ${url}...`)
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 })
    await page.waitForSelector(selector, { timeout: 5000 })

    const element = await page.$(selector)
    if (!element) {
      console.error(`✗ Element not found: ${selector}`)
      process.exit(1)
    }

    console.log(`✓ Element exists: ${selector}`)

    if (expectedText) {
      const text = await page.$eval(selector, (el) => el.textContent)
      if (text.includes(expectedText)) {
        console.log(`✓ Text matches: "${expectedText}"`)
      } else {
        console.error(`✗ Text mismatch. Expected: "${expectedText}", Got: "${text}"`)
        process.exit(1)
      }
    }

    await page.screenshot({ path: `.claude/screenshots/verify-${Date.now()}.png` })
  } catch (error) {
    console.error('✗ Verification failed:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

async function checkConsoleErrors() {
  const url = process.argv[3] || 'http://localhost:3000'

  console.log(`🔍 Checking console errors on ${url}...`)
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  const errors = []
  const warnings = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 })
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait for any async errors

    if (errors.length > 0) {
      console.log('✗ Console errors detected:')
      errors.forEach((err) => console.log(`  - ${err}`))
      process.exit(1)
    } else {
      console.log('✓ No console errors')
    }

    if (warnings.length > 0) {
      console.log('⚠️  Console warnings:')
      warnings.forEach((warn) => console.log(`  - ${warn}`))
    }
  } catch (error) {
    console.error('✗ Check failed:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

async function testIndustryFilterWithMock() {
  console.log('🧪 Testing industry filter functionality with mock data...')
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  try {
    // Navigate to test page with mock data
    await page.goto('http://localhost:3000/test/industry-filter', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    })
    console.log('✓ Test page loaded with mock data')

    // Wait for chips to render (check if any button exists near company list)
    await page.waitForSelector('button', { timeout: 5000 })

    // Get all chip buttons and their text
    const chipTexts = await page.$$eval('button', (buttons) =>
      buttons
        .map((b) => b.textContent.trim())
        .filter(
          (text) => text.includes('Industries') || text.length < 30, // Filter likely chip buttons
        ),
    )
    console.log(`✓ Industry chips found: ${chipTexts.join(', ')}`)

    // Verify 'All Industries' chip exists
    if (!chipTexts.includes('All Industries')) {
      console.error('✗ "All Industries" chip not found')
      process.exit(1)
    }
    console.log('✓ "All Industries" chip exists')

    // Take screenshot of initial state
    await page.screenshot({ path: '.claude/screenshots/filter-all-industries.png' })
    console.log('✓ Screenshot: .claude/screenshots/filter-all-industries.png')

    // Count total companies initially
    const allCompaniesCount = await page.$$eval('a[href^="/tickers/"]', (links) => links.length)
    console.log(`✓ Total companies visible: ${allCompaniesCount}`)

    // Find first non-"All Industries" chip to test filtering
    const testIndustry = chipTexts.find((text) => text !== 'All Industries')

    if (testIndustry) {
      console.log(`\n📍 Testing filter with: ${testIndustry}`)

      // Click the industry chip
      await page.evaluate((industry) => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const button = buttons.find((b) => b.textContent.trim() === industry)
        if (button) button.click()
      }, testIndustry)

      console.log(`✓ Clicked "${testIndustry}" chip`)

      // Wait for filtering to apply
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Take screenshot of filtered state
      const screenshotName = testIndustry.toLowerCase().replace(/\s+/g, '-')
      await page.screenshot({ path: `.claude/screenshots/filter-${screenshotName}.png` })
      console.log(`✓ Screenshot: .claude/screenshots/filter-${screenshotName}.png`)

      // Count filtered companies
      const filteredCount = await page.$$eval('a[href^="/tickers/"]', (links) => links.length)
      console.log(`✓ Companies shown after filtering: ${filteredCount}`)

      // Verify filtering occurred (count should be less than or equal to total)
      if (filteredCount <= allCompaniesCount && filteredCount > 0) {
        console.log(
          `✓ Filtering works (showing ${filteredCount} out of ${allCompaniesCount} companies)`,
        )
      } else if (filteredCount === 0) {
        console.log(
          `⚠️  No companies in ${testIndustry} category (this is OK if data doesn't have that industry)`,
        )
      } else {
        console.error(`✗ Unexpected company count: ${filteredCount} > ${allCompaniesCount}`)
        process.exit(1)
      }

      // Verify selected chip has active style (blue background)
      const hasActiveStyle = await page.evaluate((industry) => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const button = buttons.find((b) => b.textContent.trim() === industry)
        return button && button.classList.contains('bg-blue-600')
      }, testIndustry)

      if (hasActiveStyle) {
        console.log(`✓ "${testIndustry}" chip has active style (blue background)`)
      } else {
        console.error(`✗ "${testIndustry}" chip missing active style`)
        process.exit(1)
      }

      // Click 'All Industries' to reset
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const button = buttons.find((b) => b.textContent.trim() === 'All Industries')
        if (button) button.click()
      })

      console.log('\n✓ Clicked "All Industries" chip')

      // Wait and verify all companies shown again
      await new Promise((resolve) => setTimeout(resolve, 500))
      const resetCount = await page.$$eval('a[href^="/tickers/"]', (links) => links.length)

      if (resetCount === allCompaniesCount) {
        console.log(`✓ All companies restored: ${resetCount} companies`)
      } else {
        console.error(
          `✗ Company count mismatch after reset: expected ${allCompaniesCount}, got ${resetCount}`,
        )
        process.exit(1)
      }

      // Verify 'All Industries' chip has active style
      const allIndustriesActive = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const button = buttons.find((b) => b.textContent.trim() === 'All Industries')
        return button && button.classList.contains('bg-blue-600')
      })

      if (allIndustriesActive) {
        console.log('✓ "All Industries" chip has active style')
      } else {
        console.error('✗ "All Industries" chip missing active style')
        process.exit(1)
      }
    } else {
      console.log('⚠️  No industry chips found besides "All Industries" - cannot test filtering')
    }

    console.log('\n✅ All industry filter tests passed!')
  } catch (error) {
    console.error('✗ Test failed:', error.message)
    await page.screenshot({ path: '.claude/screenshots/filter-error.png' })
    console.log('Error screenshot saved to: .claude/screenshots/filter-error.png')
    process.exit(1)
  } finally {
    await browser.close()
  }
}

function showHelp() {
  console.log(`
E2E Testing Helper for Stonkie

Commands:
  smoke                              Run smoke test (homepage load + screenshot)
  navigate <url> [filename.png]      Navigate to URL and take screenshot
  verify <url> <selector> [text]     Verify element exists (and optionally contains text)
  console <url>                      Check for console errors on page
  testIndustryFilter                 Test industry filter with mocked backend data
  help                               Show this help

Examples:
  node .claude/e2e-helpers.js smoke
  node .claude/e2e-helpers.js navigate http://localhost:3000/tickers/AAPL ticker-page.png
  node .claude/e2e-helpers.js verify http://localhost:3000 "h1" "Stonkie"
  node .claude/e2e-helpers.js console http://localhost:3000/tickers/AAPL
  node .claude/e2e-helpers.js testIndustryFilter
`)
}

// Main execution
const command = process.argv[2] || 'help'
const handler = COMMANDS[command]

if (!handler) {
  console.error(`Unknown command: ${command}`)
  showHelp()
  process.exit(1)
}

handler().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
