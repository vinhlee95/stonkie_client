# CLAUDE.md — Stonkie Frontend

See root `../CLAUDE.md` for shared conventions.

## Gotchas

- **E2E tests use mock backend:** global setup starts HTTP mock server on localhost:8080 — NEVER point `BACKEND_URL` to production in test config
- **Font sizes:** body/content text uses `text-base md:text-lg` throughout the app. Use `text-sm` only for secondary/meta text (labels, timestamps, subtitles). New components must match this scale — don't default to `text-sm` for primary readable content.
