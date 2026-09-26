---
name: verify
description: Run frontend + backend locally and drive the app in the browser pane to verify a change.
---

# Verify recipe

## Launch

- `.claude/launch.json` has `backend` (hypercorn on :8080 from `../backend` venv) and `frontend` (`npm run dev` on :3000).
- `preview_start {name: "backend"}` first, then `{name: "frontend"}`. `.env.local` points `BACKEND_URL` at localhost:8080.

## Flows

- Ticker page: `/tickers/AAPL`. Chat = bottom nav bubble button (3rd icon, no label) → panel "AAPL · Ask about this company".
  - Input: textbox "Ask follow-up...", Enter submits → `POST :8080/api/v2/companies/AAPL/analyze` (streams, ~20–35s).
  - Stop: button "Stop request" while streaming → "Request cancelled."
  - Panel close ("Close"/minus) keeps conversation on reopen.
- Recap audio: "Listen to AAPL daily recap" button on ticker recap card.

## Gotchas

- Backend logs (`preview_logs`) show pipeline steps: statements fetched, search decision, model used.
- Pre-existing console errors on ticker page: hydration mismatch in `RecapCuratedChip` date (server vs client locale), `Cannot read properties of null (reading 'querySelector')`.
- Semantic cache uses OpenAI embeddings; 429 there is non-fatal (falls through to live pipeline).
