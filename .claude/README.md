# AI Coding Assistant Workflow

This directory contains workflow infrastructure for AI-assisted feature development. The workflow is **agent-agnostic** and works with any AI coding assistant that can:

- Run terminal commands (`npm`, `git`)
- Read and write files
- Execute TypeScript/Playwright tests

## Compatibility

✅ **Works with:**

- Claude Code (claude.ai/code)
- Cursor Composer
- GitHub Copilot Chat
- Any AI assistant with terminal + file access

## Structure

- `features.json` - Feature specifications and tracking
- `progress.md` - Session history and learnings
- `templates/` - Reusable workflow checklists
  - `session-startup.md` - Startup checklist
  - `session-completion.md` - Pre-commit verification checklist
  - `e2e-patterns.md` - E2E testing guide

## Quick Start

1. Run initialization: `.claude/init.sh` (one-time setup)
2. Add features to `features.json`
3. Follow templates during development sessions
4. Run `npm run e2e:smoke` before committing

## E2E Testing

E2E tests are standard TypeScript Playwright tests in `tests/e2e/`:

- `npm run e2e:smoke` - Fast smoke test (always run before commit)
- `npm run e2e` - Full E2E suite
- `npm run e2e:ui` - Interactive Playwright UI

See `.claude/templates/e2e-patterns.md` for details.
