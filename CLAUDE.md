# CLAUDE.md — Stonkie Frontend

See root `../CLAUDE.md` for shared conventions.

## Gotchas

- **E2E tests use mock backend:** global setup starts HTTP mock server on localhost:8080 — NEVER point `BACKEND_URL` to production in test config
