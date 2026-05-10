# Dig Deeper — v1 (button + initial chat modal state)

## Context

The market recap card ([MarketRecapCard.tsx](app/components/MarketRecapCard.tsx)) currently has no entry point to chat. Commit `a6635e8` removed an earlier non-interactive "ask about this market" CTA because the backend wasn't ready. The design handoff (`recap-chat.html` + chats 1–3) specifies a "Dig deeper" CTA at the bottom-right of the _expanded_ recap that opens a chat modal grounded in the recap.

**Scope of v1**: ship just the **button** and the **initial state of the chat modal**. No related-question fetching, no asking/answering wiring, no new backend endpoints. The recap data is already in hand from `MarketRecapIsland` — pass it through the modal, no re-fetch.

## What lands in v1

1. **"Dig deeper" pill button** on the expanded `MarketRecapCard`, bottom-right of the bullets section. Pulses (port `pulse-ring` keyframes from `recap-chat.html:81-95`). Mirrors the prototype: rounded-full accent bg, sparkle icon + label + arrow icon.
2. **`RecapChatModal`** — opens on click. Mobile = full-screen sheet; desktop = right-side panel (reuse the existing responsive layout from `ChatboxUI` / `InsightChatModal`). Slide-in animation matching prototype keyframes (`chat-anim` / `chat-sheet-anim`).
3. **Initial state inside the modal**:
   - Top: compact recap context chip ("Digging deeper into · {Market} {Cadence} · {date}" + the recap's `summary` clamped to 2 lines). Always visible, non-sticky, non-dismissible.
   - Header: "Dig deeper into this recap".
   - Helper line: "Ask about this recap…" (or similar).
   - Input pinned to bottom, **disabled** with placeholder "Coming soon — backend in progress" (or similar). No submit handler wired, no suggestions list.
   - Close button (top-right) returns to the recap.
4. **State reset on close** so reopen shows the initial state.

Out of v1: suggested questions list (no fetch, no client derivation), submit/stream wiring, conversationId persistence, per-bullet "Ask" chips, sticky/dismissible context variants.

## Files

### New

- `app/components/RecapChatModal.tsx` — owns `isOpen`, `isDesktop` (window-width listener at 768px, mirroring [InsightChatModal.tsx:35-44](app/tickers/[ticker]/insights/InsightChatModal.tsx:35)), `useScrollLock`. Receives `recap: MarketRecapItem` plus `market` + `cadence` (for the header chip). Renders the close chrome + scrollable body (recap context chip + header + helper text) + disabled input. Self-contained — does **not** mount `ChatProvider`/`ChatboxUI` yet (they bring full chat state we don't need; introduce in v2).
- `app/components/__tests__/RecapChatModal.test.tsx` — renders with a fixture recap; asserts header copy, summary present, input disabled, close button works.

### Modified

- `app/components/MarketRecapCard.tsx`
  - New optional prop `onDigDeeper?: () => void`.
  - When `expanded === true` and `onDigDeeper` defined, render the pill button bottom-right of the bullets section.
- `app/components/MarketRecapIsland.tsx`
  - Wrap the rendered `<MarketRecapCard>` with local `isOpen` state and a sibling `<RecapChatModal recap={activeRecap} ... open={isOpen} onClose={...}/>`.
  - `activeRecap` = whichever cadence is currently displayed; pass `daily ?? weekly` (matches the card's fallback in [MarketRecapCard.tsx:43](app/components/MarketRecapCard.tsx:43)).
  - `onDigDeeper={() => setIsOpen(true)}`.
- `app/globals.css`
  - Add `pulse-ring`, `chat-anim`, `chat-sheet-anim` keyframes ported from `recap-chat.html`.
- `app/components/__tests__/MarketRecapCard.test.tsx`
  - Add: button visible only when expanded + `onDigDeeper` provided, click fires the handler.

## Reused — do not re-implement

- `useScrollLock` ([app/components/hooks/useScrollLock.ts](app/components/hooks/useScrollLock.ts)) — locks page scroll while modal is open.
- Tailwind tokens (`--accent-active`, `--button-background`, `--accent-light`) already defined in the project.
- `lucide-react` icons (`Sparkles`, `ArrowRight`, `X`) — already used elsewhere (no new icon library).

## Verification

1. `npm run type-check && npm run test:unit` — green, including new tests.
2. `npm run dev` against backend on 8080. Open `/`.
3. Expand the recap → "Dig deeper" pill appears bottom-right and pulses. Collapsed state hides it.
4. Click → modal opens. Resize across 768px and reopen to confirm desktop side-panel vs mobile full-screen-sheet.
5. Modal shows: recap context chip (correct date + summary text matching the card), "Dig deeper into this recap" header, disabled input.
6. Close → recap card visible again; reopen → initial state again (no leftover state).
7. Add a Playwright spec asserting the pill is visible after expanding the recap and the modal opens on click. (`npm run e2e`)

## v2 (next slice, not now)

- Suggested-questions list — backend adds `suggested_questions` to `MarketRecapItem` on the existing `/api/markets/{market}/recaps` response (no new fetch).
- Asking/answering — new chat endpoint `POST /api/v2/recaps/{recap_id}/analyze` mirroring `/api/v2/companies/{ticker}/analyze`; frontend adds `chatService.analyzeRecapQuestion`, hoists v1's modal into `ChatboxUI` with a `RecapChatbox` wrapping `useChatState` + `useChatAPI` (mode: 'recap'). Per-recap `conversationId` persistence.

## Decisions confirmed with user

- No recap re-fetch in the modal — reuse the data already loaded by `MarketRecapIsland`.
- v1 ships button + modal initial state only; no related questions, no chat wiring.
- Context card style: always visible, non-sticky.
- Backend will be planned in parallel; frontend should not block on it.
