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

function showHelp() {
  console.log(`
E2E Testing Helper for Stonkie

Commands:
  smoke                              Run smoke test (homepage load + screenshot)
  navigate <url> [filename.png]      Navigate to URL and take screenshot
  verify <url> <selector> [text]     Verify element exists (and optionally contains text)
  console <url>                      Check for console errors on page
  help                               Show this help

Examples:
  node .claude/e2e-helpers.js smoke
  node .claude/e2e-helpers.js navigate http://localhost:3000/tickers/AAPL ticker-page.png
  node .claude/e2e-helpers.js verify http://localhost:3000 "h1" "Stonkie"
  node .claude/e2e-helpers.js console http://localhost:3000/tickers/AAPL
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
