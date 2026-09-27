---
applyTo: "**"
excludeAgent: "cloud-agent"
---

# Code review: Architecture

This checklist covers the architecture angle of code review for the Stonkie frontend (Next.js App Router, TypeScript, React Query, Tailwind, shadcn components).

Conventions are in `CLAUDE.md`. When reviewing a pull request, check the diff against them:

- Server vs Client Components: default to Server Components; `'use client'` only where interactivity/hooks are needed, pushed as low in the tree as possible.
- Data fetching: Server Components use `fetch()` with explicit revalidation; Client Components use React Query hooks (pattern: `app/components/hooks/use*.ts`). No ad-hoc `useEffect` + `fetch` for server data.
- API access goes through `lib/api/` helpers; backend URL conventions `/api/companies/{ticker}/...`, `ticker` param (not `symbol`).
- Types live in shared type modules (`app/types.ts`, `types/`); no duplicated type definitions or `any` leaking across modules.
- Styling: Tailwind; body/content text uses `text-base md:text-lg`, `text-sm` only for secondary/meta text; reuse existing shadcn/ui components instead of new one-offs.
- File placement: route-specific components colocated under the route; shared ones under `app/components/`; no god-components (flag files growing past a clear single responsibility).
- No duplicated logic that already exists (search for existing hooks/helpers before flagging).

Out of scope for this checklist (covered by the other review instructions): logic bugs, security, performance, test coverage.
