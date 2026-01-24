# Session Startup Checklist

Execute these steps at the beginning of each coding session (read-only phase).

## 1. Load State

- [ ] Read `.claude/features.json` - identify current/next feature
- [ ] Read `.claude/progress.md` - review last session's work
- [ ] Run `git log --oneline -10` - see recent commits
- [ ] Run `git status` - check for uncommitted changes

## 2. Validate Environment

- [ ] Run `npm run type-check` - ensure codebase type-safe
- [ ] Run `npm run lint` - ensure no lint errors
- [ ] Start dev server: `npm run dev` (background process)
- [ ] Wait for server ready message on port 3000

## 3. Smoke Test (E2E)

Run automated smoke test:

```bash
node .claude/e2e-helpers.js smoke
```

- [ ] Verify homepage loads without errors
- [ ] Check screenshot: `.claude/screenshots/smoke-test.png`
- [ ] Review console errors (ignore backend ERR_CONNECTION_REFUSED if backend not running)

## 4. Feature Selection

- [ ] Review pending features in features.json
- [ ] Check dependencies - select unblocked feature
- [ ] If feature in_progress, continue from last session
- [ ] Update feature status to "in_progress" if starting new
- [ ] Record session ID in feature.metadata.sessionsInvolved

## 5. Read Reference Patterns

- [ ] Read all files in feature.technicalSpec.patternsToFollow
- [ ] Note existing patterns for similar features
- [ ] Identify integration points (React Query, Tailwind, etc.)

## Ready to Code

All checks passed. Begin incremental development.
