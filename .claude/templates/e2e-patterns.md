# E2E Testing Patterns

## Overview

E2E testing uses Puppeteer via `.claude/e2e-helpers.js` script. No MCP server required.

## Available Commands

### Smoke Test (Homepage)

```bash
node .claude/e2e-helpers.js smoke
```

- Navigates to localhost:3000
- Takes screenshot
- Checks console errors
- Screenshot: `.claude/screenshots/smoke-test.png`

### Navigate & Screenshot

```bash
node .claude/e2e-helpers.js navigate <url> [filename.png]
```

Examples:

```bash
node .claude/e2e-helpers.js navigate http://localhost:3000/tickers/AAPL aapl-page.png
node .claude/e2e-helpers.js navigate http://localhost:3000/tickers/MSFT/insights insights.png
```

### Verify Element Exists

```bash
node .claude/e2e-helpers.js verify <url> <selector> [expectedText]
```

Examples:

```bash
# Check element exists
node .claude/e2e-helpers.js verify http://localhost:3000 "h1"

# Check element contains text
node .claude/e2e-helpers.js verify http://localhost:3000 "h1" "Stonkie"
node .claude/e2e-helpers.js verify http://localhost:3000/tickers/AAPL ".company-name" "Apple"
```

### Check Console Errors

```bash
node .claude/e2e-helpers.js console <url>
```

Examples:

```bash
node .claude/e2e-helpers.js console http://localhost:3000
node .claude/e2e-helpers.js console http://localhost:3000/tickers/AAPL
```

## Feature Verification Workflow

### 1. Startup Smoke Test

```bash
# Start dev server
npm run dev &

# Wait 10s for server ready
sleep 10

# Run smoke test
node .claude/e2e-helpers.js smoke
```

### 2. During Development

Navigate and screenshot at milestones:

```bash
node .claude/e2e-helpers.js navigate http://localhost:3000/your-page page-wip.png
```

### 3. Final Verification

Execute ALL steps from `feature.successCriteria.verification`:

```bash
# Example feature verification
node .claude/e2e-helpers.js verify http://localhost:3000/tickers/AAPL "#submit-btn"
node .claude/e2e-helpers.js verify http://localhost:3000/tickers/AAPL ".modal-title" "Success"
node .claude/e2e-helpers.js console http://localhost:3000/tickers/AAPL
```

## Success Criteria Schema

Add to `features.json` verification section:

```json
"verification": {
  "method": "e2e",
  "steps": [
    "Start dev server: npm run dev",
    "Wait 10 seconds",
    "Run: node .claude/e2e-helpers.js smoke",
    "Navigate: node .claude/e2e-helpers.js navigate http://localhost:3000/path page.png",
    "Verify: node .claude/e2e-helpers.js verify http://localhost:3000/path '#element'",
    "Console: node .claude/e2e-helpers.js console http://localhost:3000/path"
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

## Screenshots Location

All screenshots saved to `.claude/screenshots/` (gitignored)

## Troubleshooting

**Dev server not ready:**

```bash
# Increase wait time
sleep 15 && node .claude/e2e-helpers.js smoke
```

**Element not found:**

- Verify selector with browser DevTools
- Check if element loads async (may need longer timeout)
- Use data-testid attributes for reliable selection

**Console errors from backend:**

- Expected if backend not running (ERR_CONNECTION_REFUSED)
- Focus on frontend JS errors, not network errors

## Integration with Session Workflow

### Session Startup (Phase 1)

```bash
npm run dev &
sleep 10
node .claude/e2e-helpers.js smoke
```

### During Development (Phase 2)

```bash
# After each milestone
node .claude/e2e-helpers.js navigate http://localhost:3000/page wip-v1.png
```

### Session Completion (Phase 3)

```bash
# Execute ALL verification steps
node .claude/e2e-helpers.js verify ...
node .claude/e2e-helpers.js console ...
```

## Future Enhancements

- Add click automation
- Add form fill automation
- Add responsive testing (mobile/tablet viewports)
- Add custom assertions
- Generate HTML reports
