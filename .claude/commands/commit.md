Run a pre-commit review on staged changes, then commit if all checks pass.

Commit message argument: $ARGUMENTS

## Steps

### 1. Stage and get diff

Run `git add -A` to stage all changes, then run `git diff --cached` and `git diff --cached --name-only` to see what's staged.
If nothing is staged after adding, tell the user and stop.

### 2. Security review

Inspect the diff for:

- Hardcoded secrets, API keys, passwords, tokens (patterns like `sk-`, `AIza`, `Bearer `, `password =`, etc.)
- SQL injection risks (raw string interpolation into queries)
- XSS risks (unescaped user content rendered via `dangerouslySetInnerHTML`)
- Exposed internal paths, credentials, or PII in logs
- Production URLs in test files

If any are found, list them clearly and **stop** — do not commit.

### 3. Debug artifact scan

Check for:

- `console.log` statements in non-test files
- `debugger` statements
- TODO/FIXME comments in changed lines

Report findings. For TODOs, ask if they're intentional before proceeding. For console.log/debugger, flag as blocking.

### 4. Architecture conformance (from @CLAUDE.md)

Check the diff conforms to frontend patterns:

- **Server Components** (default): No `'use client'` unless interactivity is needed
- **Client Components** (`app/components/`): Must have `'use client'` directive
- **Data fetching**: Server Components use `fetch()` with revalidation; Client Components use React Query hooks
- **Styling**: Tailwind CSS only — no inline styles or CSS files
- **Types**: Strict TypeScript — no `any` types in new code
- No new helpers/abstractions created for one-time operations

Report any violations.

### 5. Type checking

Run: `npm run type-check`

If errors found, show them and stop.

### 6. Linting

Run: `npm run lint`

If linting errors found, show them and ask user to fix before committing. Offer to auto-fix with `npm run lint-fix`.

### 7. Unit tests

Run: `npm run test:unit`

If tests fail, show output and stop.

### 8. Commit message

If `$ARGUMENTS` is provided, use it as the commit message.
If not provided, generate a conventional commit message based on the diff:

- Subject line: `<type>(<scope>): <description>` — one of: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`; keep under 72 chars
- Body (required): 2-4 lines explaining _what_ changed and _why_; wrap at 72 chars
- Be specific and meaningful — describe the actual behavior change, not just the file touched

Show the message to the user and proceed to commit immediately without asking for confirmation.

### 9. Commit

Run the commit with the confirmed message:

```
git commit -m "$(cat <<'EOF'
<message>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Report success and show the commit hash.
