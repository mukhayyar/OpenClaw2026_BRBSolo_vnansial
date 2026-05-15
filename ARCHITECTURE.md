# ARCHITECTURE.md

## Big picture
```
                        ┌──────────────────────────────┐
        browser ──────► │  Vite dev (5173) / nginx     │
                        │  React 19 + Tailwind v4      │
                        │  Bento UI · Apple style      │
                        └──────────────┬───────────────┘
                                       │ fetch JSON
                        ┌──────────────▼───────────────┐
                        │ Express API (3001)           │
                        │  /api/health/score  ─┐       │
                        │  /api/idx/*         ─┼─► IDX │
                        │  /api/crypto/*      ─┼─► CG  │
                        │  /api/market/*      ─┼─► YF  │
                        │  /api/insurance/*   ─┘       │
                        │  /api/agent/chat   ─► LLM    │
                        │      └─► tool loop (8 max)   │
                        │  /api/me/portfolio ─► SQLite │
                        └──────┬──────────┬────────────┘
                               │          │
                  ┌────────────▼─┐   ┌────▼──────────────┐
                  │ SQLite (opt) │   │ Telegram bot (opt)│
                  │ memory fall  │   │ polling /commands │
                  │ -back        │   │                    │
                  └──────────────┘   └────────────────────┘
```

## Frontend
- **React Router** drives `src/main.tsx`.
- **Layout** is shared, except `/` (home) which hides the nav so the bento
  grid is the only navigation surface.
- **Pages** use `PageShell` (top-of-page header) + `Bento` (tile container).
- **Forms** persist to `localStorage` first (instant), then optionally to
  `/api/me/*` (SQLite-backed) when a `telegramChatId` is supplied.

## Backend
- `server/index.js` is the only entry point. It wires routes and starts the
  optional Telegram bot.
- `server/agent/loop.js` runs the LLM tool-calling loop. The system prompt
  in `server/agent/systemPrompt.js` enumerates capabilities.
- `server/lib/*` are thin wrappers around external APIs with in-memory
  caches + safe error returns.
- `server/tools/runner.js` maps a tool name to an implementation. Adding a
  tool = three edits (`runner.js`, `definitions.js`, system prompt).

## Data sources
- **IDX (saham Indonesia):** proxy with Referer header (idx.co.id blocks
  raw browser fetches). Cached 10 min.
- **CoinGecko (crypto):** public, no key. Cached 60 s.
- **Yahoo Finance:** via `yahoo-finance2`. Cached 60 s. `YAHOO_MOCK=1`
  enables deterministic fixtures for tests.
- **Insurance:** static curated dataset in `server/lib/insurance.js` —
  estimates only.
- **OJK:** static demo Map in `server/data/ojk.js`. Production should add
  a Satgas Waspada Investasi feed.

## Persistence
SQLite via `better-sqlite3` (optional). If the package isn't installed,
the in-memory `Map` driver activates with a clear log warning. Schema is
declared inside `server/lib/db.js`.

Tables: `user`, `health_snapshot`, `holding`, `buffer`.

## Telegram bot
Polling-mode HTTP API client in `server/integrations/telegram.js`. Boots
only if `TELEGRAM_BOT_TOKEN` is set. Each Telegram chat maps 1:1 to a
`user` row.

## Security posture
- Server is the trust boundary. The agent only runs tools registered in
  `runner.js`.
- No raw OS commands, no SQL string concatenation (parameterized via
  better-sqlite3).
- CORS: open in dev (`cors({ origin: true })`). Production behind nginx
  should restrict.

## Performance
- All external calls are cached in memory.
- Bundles produced by Vite are static and CDN-friendly. Express serves
  `dist/` when present.
