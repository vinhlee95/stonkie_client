# Code review: Scalability/Performance

This checklist covers the scalability/performance angle of code review for the Stonkie frontend (Next.js App Router SSR/SSG, React Query, PWA, charts).

When reviewing a pull request, check:
- Bundle size: heavy libraries imported into client components (whole-library imports, chart libs not lazy-loaded via `next/dynamic`); server-only code pulled into client bundles.
- Unnecessary client components that could render on the server.
- Request waterfalls: sequential `await`s in Server Components that could be `Promise.all`; client fetches chained on each other; fetching in loops.
- Caching: `fetch` without appropriate `revalidate`/cache options for data that is cacheable; `cache: 'no-store'` or dynamic rendering introduced on pages that were static; React Query `staleTime` of 0 on rarely-changing data causing refetch storms.
- Rendering: expensive computations in render without memoization on large lists; re-render cascades from context values recreated every render; lists without virtualization when unbounded.
- Images/fonts: `<img>` instead of `next/image`; missing sizes; unoptimized large assets in `public/`.
- Service worker / PWA caching rules that cache API responses indefinitely.

Out of scope for this checklist (covered by the other review instructions): logic bugs, conventions, security, test coverage.
