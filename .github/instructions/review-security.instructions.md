---
applyTo: "**"
excludeAgent: "cloud-agent"
---

# Code review: Security

This checklist covers the security angle of code review for the Stonkie frontend (Next.js App Router, Auth.js via `auth.ts`, `proxy.ts`, renders LLM-generated markdown answers).

When reviewing a pull request, check:
- XSS: `dangerouslySetInnerHTML`, markdown rendering of LLM/user content without sanitization, `href` built from untrusted input (`javascript:` URLs), unescaped query params rendered into HTML.
- Secrets: server-only secrets referenced in client components or exposed via `NEXT_PUBLIC_*`; tokens logged or stored in `localStorage`.
- Auth: protected pages/routes/API routes (`app/api/`) checking the session server-side; session/token forwarding to the backend only to the backend origin; `proxy.ts` matchers not accidentally excluding protected paths.
- Open redirects: `callbackUrl`/redirect targets from query params not validated.
- Server Actions / route handlers: input validation, CSRF-safe methods, no trust in client-supplied user ids.
- Third-party scripts/iframes added without need; CSP or security headers loosened in `next.config.ts`.
- New dependencies that are unpinned or unmaintained.

Out of scope for this checklist (covered by the other review instructions): logic bugs unrelated to security, conventions, performance, test coverage.
