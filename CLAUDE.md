# CLAUDE.md — Working notes for Claude Code

This file is the primary brief for Claude Code (Anthropic CLI) when working
in this repo. Other AI coding agents — Cursor, Aider, Cline, Gemini CLI —
should read `AGENTS.md`, which mirrors this but is organised by capability.

## TL;DR
Vnansial is a self-hosted, open-source Indonesian financial literacy
platform: skor kesehatan finansial, cek emiten IDX, crypto risk watch,
asuransi calculator, portfolio + buffer tracker, dan AI Asisten via tool
calling. Front-end: React 19 + Vite + Tailwind v4. Back-end: Express,
optional SQLite, optional Telegram bot.

## Layout
```
src/
  main.tsx               # React router setup
  index.css              # Design system (white/green Apple/bento)
  components/            # Bento, Layout, ChatUI, FloatingChat, LandscapeHero, …
  pages/                 # Landing, Kesehatan, CekInvestasi, CekEmiten,
                         # CryptoWatch, Asuransi, Portofolio, Kalkulator,
                         # Edukasi, Lapor, Rencana, AsistenAI
  lib/                   # chatApi.ts, healthScore.ts (mirror of server)
server/
  index.js               # Express app entry
  agent/                 # systemPrompt.js, loop.js
  lib/                   # openai (SumoPod), yahoo, idx, coingecko,
                         # insurance, db (sqlite|memory)
  tools/                 # definitions.js + runner.js + per-domain modules
  integrations/          # telegram.js (polling, env-gated)
  data/                  # ojk.js, vnansial.db (if sqlite installed)
tests/
  client/, server/       # vitest
.plan/, .progress/       # human-readable planning + status
```

## Coding rules
- **Bahasa Indonesia for user-facing strings.** Comments and code identifiers
  stay English.
- **One bento per concern.** Don't cram two unrelated things in the same
  card. Use `Bento` component (`src/components/Bento.tsx`) with `tone` and
  `padding` props.
- **Green palette only.** No neon, no glass, no dark mode. Refer to CSS
  variables in `src/index.css`.
- **Server proxies for external APIs.** Anything with CORS issues (idx.co.id)
  goes through `/api/idx/*`. CoinGecko works direct but we proxy to add
  caching.
- **Tools must be deterministic & safe.** Each agent tool wrapper in
  `server/tools/runner.js` should never throw — return `{ error }` instead.
- **Disclaimers in tool outputs.** Vnansial is not licensed financial
  advice. Every tool result should set or echo `disclaimer`.
- **No premature abstractions.** Prefer ~3 similar pages over one
  meta-renderer. Apple-style design rewards specificity.

## Commands
```bash
npm install                 # one-time
npm run dev                 # web :5173 + api :3001 (concurrently)
npm run build               # vite build → dist/
npm run start               # node server/index.js (serves dist + api)
npm test                    # vitest run (server + client smoke)
```

## Environment
Required: `SUMOPOD_API_KEY` (for AI Asisten).
Optional:
- `TELEGRAM_BOT_TOKEN` — enables the Telegram bot
- `VNANSIAL_DB_PATH` — override SQLite location
- `YAHOO_MOCK=1` — deterministic Yahoo Finance fixtures
- `PORT` (default 3001), `VITE_API_URL` (default '')

## When adding a new tool
1. Write the implementation in `server/tools/<domain>.js` or in a `lib/`
   module if it wraps a third-party API.
2. Register the wrapper in `server/tools/runner.js`.
3. Add the JSON schema in `server/tools/definitions.js`.
4. Add an HTTP endpoint in `server/index.js` if the page needs direct
   access.
5. Mirror critical client-side logic in `src/lib/<domain>.ts` (so the page
   gets instant feedback while the agent uses the same scoring server-side).
6. Add a vitest in `tests/server/<domain>.test.js`.

## When adding a new page
1. Create `src/pages/<Name>.tsx` using `PageShell` + `Bento`.
2. Register the route in `src/main.tsx`.
3. Add the nav entry in `src/components/Layout.tsx`.
4. Add a feature tile on `src/pages/Landing.tsx`.

## When you break something
- Run `npm test` before claiming done.
- Type-check via `npx tsc --noEmit` if changing TypeScript shapes.
- The dev server is `npm run dev`; the user can run it themselves and tail
  the log.

## What NOT to do
- Don't re-introduce dark mode, Web3 ticker, wallet modal, glass effects.
- Don't fetch idx.co.id from the browser (CORS will fail) — always proxy.
- Don't make breaking changes to tool argument shapes without bumping the
  system prompt to match.
- Don't add new third-party UI libraries — stick with Tailwind v4 + Framer
  Motion only.

## Reference
- `AGENTS.md` — capabilities-oriented brief for non-Claude agents.
- `CONTRIBUTING.md` — pull-request / commit workflow.
- `ARCHITECTURE.md` — diagram + data-flow.
- `DEPLOYMENT.md` — deploy on Sumopod / Jetorbit / generic VPS.
- `.plan/00-index.plan` — current roadmap.
