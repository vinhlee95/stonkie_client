# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Style

In all interactions and commit messages, be extremely concise. Sacrifice grammar for the sake of concision.

## Plans

At the end of each plan, give me a list of unresolved questions to answer, if any.
Make the questions extremely concise. Sacrifice grammar for the sake of concision.

**Plan Workflow:** After plan approval, automatically create GitHub issue with plan content using `scripts/create-plan-issue.sh`. Issue gets labeled with `plan` and `enhancement`.

## Project Overview

Stonkie is a Next.js 15-based stock analysis application deployed at https://stonkie.vercel.app/. The app provides financial data visualization, AI-powered company insights, and real-time stock information.

**Backend Dependency:** This frontend requires the Stonkie backend (https://github.com/vinhlee95/stonkie_backend) running locally or in production.

## Commands

### Development

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build (uses Webpack)
npm start            # Start production server
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint-fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

**Pre-commit Hook:** Runs `type-check` and `lint-staged` automatically. The lint-staged config formats and lints staged files.

## Architecture

### Rendering Strategy

The app uses a **hybrid rendering approach**:

1. **Server Components (Default)**: Most pages are Server Components that fetch data directly via `fetch()` with Next.js caching
   - Home page (`app/page.tsx`): Fetches most-viewed companies
   - Ticker detail pages (`app/tickers/[ticker]/page.tsx`): Uses Static Site Generation (SSG) with ISR
   - Financial statements: Server-side rendered with revalidation

2. **Client Components**: Used for interactivity
   - All components in `app/components/` are Client Components (marked with `'use client'`)
   - Chat interfaces, search, favourites, charts, modals

3. **Static Generation**: Popular ticker pages are pre-rendered at build time using `generateStaticParams()` with a revalidation period of 30 seconds

### Data Fetching

**Server Components:**

- Use native `fetch()` with Next.js caching options
- Example: `fetch(url, { next: { revalidate: 120 } })`
- Revalidation periods vary: 1 minute for company list, 2 minutes for key stats/statements

**Client Components:**

- Use **TanStack React Query** for all API calls
- QueryClient configured in `app/providers/QueryProvider.tsx` with:
  - `staleTime: 10 minutes`
  - `gcTime: 30 minutes`
  - Refetching disabled on mount/window focus/reconnect
- Streaming responses handled via ReadableStream for chat/AI features

### Directory Structure

```
app/
├── page.tsx                    # Home page (SSR)
├── layout.tsx                  # Root layout with QueryProvider
├── types.ts                    # Shared TypeScript types
├── providers/
│   └── QueryProvider.tsx       # React Query setup
├── components/                 # Reusable client components
│   ├── hooks/                  # Custom React hooks
│   │   ├── useChatAPI.ts       # Chat streaming logic
│   │   ├── useFavourites.ts    # LocalStorage favourites
│   │   └── useFAQQuery.ts      # FAQ data fetching
│   └── services/
│       └── chatService.ts      # Backend API calls
└── tickers/
    └── [ticker]/               # Dynamic ticker routes
        ├── page.tsx            # Overview (SSG with ISR)
        ├── layout.tsx          # Ticker-specific layout
        ├── insights/           # AI-powered insights
        ├── statements/         # Financial statements
        │   ├── balance_sheet/
        │   ├── cash_flow/
        │   └── filing/
        └── revenue/            # Revenue analysis
```

### Key Patterns

**1. Streaming Responses**
The chat features use Server-Sent Events via ReadableStream:

```typescript
const reader = await chatService.analyzeQuestion(...)
const decoder = new TextDecoder()
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value)
  // Parse JSON chunks split by newlines
}
```

**2. Type Guards**
Financial statement types use type guards for discriminated unions:

```typescript
isAnnualStatement(statement) // Check if AnnualFinancialStatement
isQuarterlyStatement(statement) // Check if QuarterlyFinancialStatement
```

**3. Environment Variables**

- `BACKEND_URL`: Server-side API URL (SSR/SSG only)
- `NEXT_PUBLIC_BACKEND_URL`: Client-side API URL (defaults to localhost:8080)
- `NEXT_PUBLIC_FINNHUB_API_KEY`: Finnhub API key for stock data

**4. Progressive Web App (PWA)**

- PWA features enabled in production builds only via `next-pwa`
- Manual service worker registration in `UpdatePrompt` component
- Custom service worker logic in `sw-custom.js`

**5. Path Aliases**

- `@/*` maps to the root directory (configured in `tsconfig.json`)

## Pre-Push Checks

**Automated via Claude hook:** Type-check, unit tests, and e2e tests run automatically before any `git push` operation. Hook configured in `~/.claude/settings.json`.

Build verification happens on Vercel with production env vars.

## Deployment

**Production:** All commits to `main` auto-deploy to Vercel (https://stonkie.vercel.app/) within 1-2 minutes.

**Build Configuration:**

- Development uses Turbopack (`--turbopack` flag)
- Production builds use Webpack (`--webpack` flag)
- PWA wrapper only applied in production builds

## Development Guidelines

1. **Git Workflow:** After completing any code changes, ALWAYS ask the user whether to commit and push to remote. Never commit or push without explicit approval.

2. **Test Coverage for New Features:** When implementing new features, ALWAYS ask the user if unit tests should be created. New features must be covered by tests to ensure quality and prevent regressions.

3. **Styling:** Use Tailwind CSS exclusively. No inline styles or CSS files.

4. **Icons:** Use Lucide React icon library

5. **Routing:** Next.js App Router file-based routing. New pages go in `app/` directory.

6. **Data Fetching:**
   - Server Components: Use native `fetch()` with appropriate revalidation
   - Client Components: Use React Query via custom hooks

7. **Components:**
   - Place reusable components in `app/components/`
   - Server Components are the default; add `'use client'` only when needed

8. **Caching:**
   - Root route cached via `headers()` in `next.config.ts`
   - Individual routes use `revalidate` export constant
   - Client-side caching managed by React Query

9. **TypeScript:** Strict mode enabled. Run `npm run type-check` before committing.

10. **Charts:** Use Chart.js with react-chartjs-2 wrapper. Chart utilities in `app/tickers/[ticker]/chartUtils.tsx`

## Testing

### Component/Unit Tests (Vitest + React Testing Library)

- Tests located in `app/components/__tests__/` and `app/components/hooks/__tests__/`
- Run via `npm run test` (watch mode) or `npm run test:unit` (CI/single run)
- Config in `vitest.config.ts`, setup in `tests/setup.ts`
- Test utilities in `tests/test-utils.tsx` (custom render with QueryClient wrapper)

**Testing Patterns:**

| Component Type      | Test Approach            | Example                  |
| ------------------- | ------------------------ | ------------------------ |
| Pure presentational | Render + assertions      | ResourceChips            |
| Interactive         | userEvent + state checks | FavouriteButton          |
| Hooks               | renderHook + act         | useFavourites            |
| React Query         | Mock QueryClient         | Data-fetching components |

**Mocks:**

- Next.js navigation mocked in `tests/setup.ts`
- localStorage mocked for favourites tests
- matchMedia mocked for responsive components

### E2E Tests (Playwright)

**CRITICAL: Never use production URLs or production data in tests.**

- Tests located in `tests/e2e/`
- Run via `npm run e2e`
- Config in `playwright.config.ts`

**Backend Mocking:**

- Mock server runs on localhost:8080 during tests
- Global setup (`tests/global-setup.ts`) starts HTTP mock server before tests
- NEVER set `BACKEND_URL` to production URL in test config
- Tests work with mocked backend responses

**Mock Server:**

- HTTP server mocks backend API endpoints
- Handles both SSR (server-side) and client-side requests
- Auto-starts/stops with test suite via globalSetup/teardown
