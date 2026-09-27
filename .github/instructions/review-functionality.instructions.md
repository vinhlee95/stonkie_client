---
applyTo: "**"
excludeAgent: "cloud-agent"
---

# Code review: Functionality

This checklist covers the functionality angle of code review for the Stonkie frontend (Next.js App Router in `app/`, TypeScript, React Query, Auth.js via `auth.ts`, proxy in `proxy.ts`, backend API at `/api/companies/{ticker}/...`).

When reviewing a pull request, check:
- Does the code do what INTENT says? Wrong conditions, off-by-one, inverted logic, wrong field names vs backend response shapes (check `lib/api/` and `app/types.ts`).
- UI states: loading, empty, error and not-found states handled; no crash on `undefined` data; streaming (SSE) responses handled incrementally and terminated correctly.
- Hydration mismatches: server/client render differences (dates, `Math.random`, `window` access during render).
- React correctness: missing/incorrect hook deps, stale closures, keys in lists, state updates after unmount, effects that loop.
- Routing: dynamic params (`ticker`) normalized (case), `notFound()`/redirects correct, links point to existing routes.
- Auth flows: signed-out vs signed-in behavior matches intent.
- Number/date formatting: currency, percentages, negative values, NaN/null from API.

Out of scope for this checklist (covered by the other review instructions): component/data-fetching conventions, security, performance, test coverage.
