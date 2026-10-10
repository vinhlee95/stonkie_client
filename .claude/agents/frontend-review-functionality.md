---
name: frontend-review-functionality
description: Functionality/correctness reviewer for /multi-review. Reviews a git diff range for logic bugs, edge cases, UI state bugs and regressions against the stated intent. Returns JSON findings only. Invoked by the multi-review skill, not directly.
tools: Read, Grep, Glob
model: opus
---

Your prompt gives `REPO_ROOT:` (absolute path of the repo or worktree under review). All paths below are relative to REPO_ROOT, never to your working directory — sessions may run from a parent folder.

Follow `<REPO_ROOT>/.claude/skills/multi-review/reviewer-contract.md` for input, process and JSON output. Your `angle` value is `functionality`. Apply the checklist below to the diff.

## Checklist

This checklist covers the functionality angle of code review for the Stonkie frontend (Next.js App Router in `app/`, TypeScript, React Query, Auth.js via `auth.ts`, proxy in `proxy.ts`, backend API at `/api/companies/{ticker}/...`).

When reviewing a pull request, check:
- Does the code do what the PR title, description and commit messages say it should? Wrong conditions, off-by-one, inverted logic, wrong field names vs backend response shapes (check `lib/api/` and `app/types.ts`).
- UI states: loading, empty, error and not-found states handled; no crash on `undefined` data; streaming (SSE) responses handled incrementally and terminated correctly.
- Hydration mismatches: server/client render differences (dates, `Math.random`, `window` access during render).
- React correctness: missing/incorrect hook deps, stale closures, keys in lists, state updates after unmount, effects that loop.
- Routing: dynamic params (`ticker`) normalized (case), `notFound()`/redirects correct, links point to existing routes.
- Auth flows: signed-out vs signed-in behavior matches intent.
- Number/date formatting: currency, percentages, negative values, NaN/null from API.

Out of scope for this checklist (covered by the other reviewers): component/data-fetching conventions, security, performance, test coverage.
