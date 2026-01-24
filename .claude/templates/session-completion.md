# Session Completion Checklist

Execute these steps before ending each coding session.

## 1. Verification (Mandatory)

### Static Checks

- [ ] Run `npm run type-check` - must pass
- [ ] Run `npm run lint` - must pass
- [ ] Review all modified files for adherence to CLAUDE.md guidelines

### E2E Verification (Puppeteer)

Execute ALL steps from feature.successCriteria.verification using `.claude/e2e-helpers.js`:

```bash
node .claude/e2e-helpers.js verify <url> <selector> [expectedText]
node .claude/e2e-helpers.js console <url>
node .claude/e2e-helpers.js navigate <url> final-state.png
```

- [ ] Navigate to specified URLs
- [ ] Verify elements exist with specified selectors
- [ ] Verify element content matches expectations
- [ ] Take screenshots of success states
- [ ] Check browser console has no errors
- [ ] Review all screenshots in `.claude/screenshots/`

See `.claude/templates/e2e-patterns.md` for detailed usage.

### Manual Checks

- [ ] Visual inspection in browser
- [ ] Test user flows end-to-end
- [ ] Verify data loads correctly
- [ ] Check error states handled gracefully

## 2. Update State Files

### features.json

- [ ] Update feature.status (in_progress → testing → completed, or stay in_progress)
- [ ] Add modified files to feature.technicalSpec.filesAffected
- [ ] Add commit SHA to feature.metadata.commitsLinked
- [ ] Update feature.metadata timestamps
- [ ] Update lastUpdated timestamp
- [ ] If blocked, set status="blocked" and document in blockedBy

### progress.md

Add new session entry with:

- [ ] Session metadata (ID, timestamp, feature ID)
- [ ] Startup checks summary
- [ ] Work accomplished this session
- [ ] Files modified (with line counts)
- [ ] Verification results (pass/fail for each criterion)
- [ ] Blockers encountered (if any)
- [ ] Learnings (patterns discovered, pitfalls avoided, reusable code locations)
- [ ] Screenshots (if relevant)
- [ ] Next session plan (if feature incomplete)

## 3. Git Commits

### Code Commit

- [ ] Stage modified application files
- [ ] Write clear commit message:
  - First line: imperative mood, <72 chars (e.g., "Add loading skeleton to ticker page")
  - Body: bullet points of changes (optional if obvious)
  - Footer: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- [ ] Commit with `git commit` (pre-commit hook will run)
- [ ] Verify commit created successfully

### Workflow State Commit

- [ ] Stage `.claude/features.json` and `.claude/progress.md`
- [ ] Commit separately: "Update workflow state for [feature-id]"
- [ ] Include co-author tag

## 4. Session Summary

Print to user:

- [ ] Feature worked on (ID + title)
- [ ] Status change (before → after)
- [ ] Files modified count
- [ ] Verification status (✓ all passed, or ✗ with details)
- [ ] Blockers (if any)
- [ ] Next steps for following session

## 5. Clean Handoff

- [ ] No uncommitted changes (unless intentional WIP)
- [ ] Dev server can be stopped
- [ ] Codebase in stable state for next session
- [ ] All learnings documented

## Status Decision Tree

**Mark as "completed"** if:

- All functional success criteria met
- All technical success criteria met (type-check, lint pass)
- All E2E verification steps pass
- No known blockers

**Keep as "in_progress"** if:

- Partial implementation complete
- Some tests passing, some failing
- Need more time to finish
- Waiting on user feedback

**Change to "blocked"** if:

- External dependency missing (backend API, library)
- Discovered architectural issue needing discussion
- Feature requirements unclear
- Technical blocker unresolvable this session

**Move to "testing"** if:

- Implementation complete
- Ready for comprehensive verification
- Next session will focus on testing only
