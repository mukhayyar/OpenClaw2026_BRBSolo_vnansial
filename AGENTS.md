# AGENTS.md — Brief for AI coding agents (non-Claude)

Read this if you're Cursor, Aider, Cline, Gemini CLI, GitHub Copilot Workspace,
Devin, or any other agent landing in this repo for the first time.

`CLAUDE.md` is the authoritative version; this file is the friendlier
capabilities-oriented summary.

## What this repo is
Vnansial — Indonesian financial literacy platform with seven first-class
domains:

| Domain               | Page                      | Server route prefix      |
|----------------------|---------------------------|--------------------------|
| Kesehatan Finansial  | `/kesehatan`              | `/api/health/score`      |
| Cek Investasi (OJK)  | `/cek-investasi`          | (client-only)            |
| Cek Emiten (IDX)     | `/emiten`                 | `/api/idx/*`             |
| CryptoWatch          | `/crypto`                 | `/api/crypto/*`          |
| Asuransi             | `/asuransi`               | `/api/insurance/*`       |
| Kalkulator Pinjaman  | `/kalkulator`             | (client-only)            |
| Portofolio + Buffer  | `/portofolio`             | `/api/me/portfolio/*`    |
| Edukasi              | `/edukasi`                | (client-only)            |
| Lapor Penipuan       | `/lapor`                  | (client-only)            |
| Rencana Investasi    | `/rencana-investasi`      | `/api/market/*`          |
| Asisten AI           | `/asisten`                | `/api/agent/chat`        |

## What every agent should know
- **Design language:** Apple-inspired, white base, green palette, bento
  grid. No neon, no glass, no dark mode. Variables are in
  `src/index.css` (`--vn-forest`, `--vn-sage`, `--vn-mint`, …).
- **Stack:** React 19 + Vite 8 + Tailwind v4 + Framer Motion + React Router
  7 (front). Express 5 + OpenAI SDK (server). Optional better-sqlite3,
  optional Telegram polling.
- **Tool-calling:** Server-side LLM (Qwen via SumoPod) loops over tools
  defined in `server/tools/definitions.js`; each maps to a function in
  `runner.js`.
- **Indonesian:** All UI strings, error messages, and tool descriptions
  are in Bahasa Indonesia.

## What you should NOT do
- Don't import new UI libraries.
- Don't write to `.env` (it's gitignored, user-managed).
- Don't bypass `server/lib/idx.js` — idx.co.id rejects raw browser fetches.
- Don't hard-code crypto risk scores; use `scoreCoinRisk` heuristic.
- Don't claim "done" without running `npm test`.

## How to extend
- New tool: `server/tools/<domain>.js` → register in `runner.js` → schema
  in `definitions.js` → optional HTTP route in `index.js`.
- New page: `src/pages/<Name>.tsx` → route in `main.tsx` → nav entry in
  `Layout.tsx` → tile on Landing.
- New external API: wrap in `server/lib/<name>.js` with cache + safe
  error returns (`{ error }`).

## Open source ethos
- Self-hostable. Users bring their own SumoPod (or other OpenAI-compatible)
  key. CoinGecko/IDX/Yahoo are public and free.
- SQLite + Telegram are optional — code must gracefully degrade when those
  are absent.
- See `DEPLOYMENT.md` for production install on Sumopod / Jetorbit / generic
  VPS.
