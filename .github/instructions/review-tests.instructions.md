---
applyTo: "**"
excludeAgent: "cloud-agent"
---

# Code review: Tests

This checklist covers the tests angle of code review for the Stonkie frontend (vitest unit tests `**/*.{test,spec}.{ts,tsx}`; Playwright e2e in `tests/e2e/` against a mock backend started by `tests/global-setup.ts` on localhost:8080).

When reviewing a pull request, check:
- New or changed behavior (components, hooks, `lib/api/` helpers, route handlers) without a corresponding unit or e2e test change. Severity `high` for new core logic/user flow with no test.
- **Tests must never hit real external services or the production backend.** E2E must use the mock backend; `BACKEND_URL` must never point to production in test config. Any real network call is `high`.
- New API response shapes used by the UI must be added to the e2e mock backend fixtures.
- Weak tests: no assertions, snapshot-only tests for logic, asserting implementation details instead of rendered behavior, over-mocking the unit under test.
- Brittle tests: CSS/xpath selectors instead of roles/labels/test ids, fixed `waitForTimeout` sleeps, dependence on current date/time without mocking.
- Missing tests for the loading/error/empty states the change introduces.

Out of scope for this checklist (covered by the other review instructions): production-code logic bugs, conventions, security, performance.
