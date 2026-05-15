# Vnansial — Pitch Deck

> Use this document as the source for AI slide generators (Gamma, Beautiful.ai, etc.)
> or as a hand-off brief for stakeholders.

**Live demo:** https://vnansial.mukhayyar.my.id/
**Repo:** https://github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial
**Team:** BRBSolo · OpenClaw Agenthon 2026
**License:** Apache 2.0 — self-hostable, bring-your-own-AI

---

## Slide 1 — Title

**Vnansial** — One financial wellbeing platform for every Indonesian.

> *Don't lose your money because you didn't have the right information.*

Free · Open source · Bahasa Indonesia first · Mobile-friendly · Self-hostable

---

## Slide 1.5 — Why I built this (personal)

I'm in my final year of university. The semester I started building Vnansial
was the same semester three things hit me at once:

1. **My first real "where is my money going?" panic.** I had been working
   freelance for two years, but I had no idea what my emergency fund covered,
   whether my reksadana account was actually growing, or how much of my
   monthly income was just leaking to small expenses.
2. **A friend got scammed.** She lost Rp 4 juta to a "robot trading" scheme
   that promised 8% per month. By the time we figured out it was illegal
   (it was never registered with OJK), the WhatsApp number was gone.
3. **Family asked me for advice.** My younger cousins, my aunts — they
   assumed that because I "do computers" I must know about money. I didn't.
   But I noticed nobody else in our circle did either, and the official
   resources (OJK PDFs, BI bulletins, Bappebti rulings) felt designed for
   compliance officers, not for normal people about to make a Tokopedia
   payment.

These are not unique problems. They are *the* problems for Indonesia's young
generation right now:

- **49.7% national financial literacy** (OJK 2024). Half of us are flying
  blind.
- **Pinjol ilegal** ads targeted at students hit every social platform
  weekly.
- **Binary options & "robot trading"** scams collectively burned Rp 139T+
  since 2020 — many victims are 18–30.
- **Crypto FOMO** drives kids into rug-pulls without a single check on
  market cap, age, or audit status.
- **Asuransi** feels like a black box: agents push unit-link products with
  high acquisition costs while BPJS Kesehatan goes underused.
- **Career-young Indonesians** (interns, fresh grads, freelancers) live
  paycheck-to-paycheck with no money buffer, no emergency fund, no
  cashflow tracking — because nobody taught us how, and the existing tools
  feel like enterprise software.

So I built Vnansial — first as a tool for me, then for my friends, then for
anyone in Indonesia who wants a calm place to figure their finances out.
The bento UI is intentional: I wanted it to feel like the apps we already
trust (Apple, Notion) instead of another stressful spreadsheet. The AI
assistant is intentional: I wanted to ask questions the way I would in a
WhatsApp group, not learn another query language. The open-source +
self-host story is intentional: an NGO, a university financial wellness
program, a fintech CSR team — anyone can fork this and run it for thousands
of people on a $5 VPS.

This is the platform I wish my 18-year-old self had downloaded.

---

## Slide 2 — Why this exists

Indonesia is the world's fourth most populous country, but financial literacy
hasn't kept up with the speed of fintech, crypto, and social-media-fuelled
scams:

- **Rp 139 trillion** lost to investment scams since 2020 (OJK / SWI).
- **5,000+** illegal investment entities blocked by the Satgas Waspada
  Investasi between 2020–2025.
- **49.7%** national financial literacy index — still below 50%
  (Survei Nasional Literasi & Inklusi Keuangan, OJK).
- Predatory lenders ("pinjol ilegal"), binary options, robot-trading
  ponzi schemes, and crypto rug-pulls flood Indonesian social feeds daily.

The country has tools, hotlines, and regulations — but they're scattered,
in formal language, and absent from where people actually make decisions
(WhatsApp, TikTok, payday).

---

## Slide 3 — What Vnansial does

Vnansial is **one calm bento-style web app + AI assistant** that brings
nine first-class features together:

| Pillar | Feature | What it answers |
|--------|---------|-----------------|
| Diagnosis | **Cek Kesehatan Finansial** | "Am I financially healthy?" — 0–100 score from 4 pillars (budget, emergency fund, debt, savings). |
| Verification | **Cek Investasi (OJK)** | "Is this company licensed?" |
| Saham (Stocks) | **Cek Emiten (IDX)** | "Tell me everything IDX has on AADI / BBCA / GOTO." |
| Crypto | **CryptoWatch** | "How risky is this coin? Could it be a scam?" |
| Asuransi | **Insurance Compare** | "Which insurance is right for me, and how much will I pay?" |
| Lending | **Kalkulator Pinjaman** | "Is this a fair loan or predatory?" |
| Personal Finance | **Portofolio + Money Buffer** | "Where do all my assets, savings, and reserves stand?" |
| Education | **Edukasi** | "Teach me the basics, in plain Indonesian." |
| Recovery | **Lapor Penipuan** | "I just got scammed — what do I do, *right now*?" |
| AI Glue | **Asisten Vnansial** | Conversational entry to every tool above. |
| Mobile | **Telegram bot** | Ask the assistant from Telegram (optional). |

---

## Slide 4 — Product principles

1. **Calm UI, not "AI-ish".** Apple-style typography, white base, green
   accents, bento tiles. No neon, no glass, no Web3 noise. Health > hype.
2. **Local first, server upgradeable.** Every interactive feature works
   from `localStorage`. When the server is up (and the PIN is provided),
   data persists to SQLite.
3. **Disclaimers built in.** Every financial tool emits a disclaimer
   alongside its answer. Vnansial is not a licensed advisor.
4. **Open data, public APIs.** No paywalled feeds. We proxy IDX,
   CoinGecko, and Yahoo Finance so anyone can self-host.
5. **Bring-your-own AI.** We default to SumoPod (Indonesian inference
   provider, Qwen model), but the OpenAI SDK shim means anyone can point
   the server at OpenAI, Anthropic-compatible proxies, OpenRouter, or a
   local Ollama. Sumopod is recommended for Indonesian latency + free
   credits — not required.

---

## Slide 5 — Architecture

```
   Browser  ────► React 19 + Vite + Tailwind v4 (bento, Apple-styled)
                  │
                  │ JSON over /api
                  ▼
   Express 5  ────►  IDX proxy (cookie-warmed) ──► idx.co.id
                ────►  CoinGecko proxy (cached)  ──► api.coingecko.com
                ────►  Yahoo Finance (cached)    ──► yahoo-finance2
                ────►  Tool-calling loop (≤ 8 iterations)
                ────►  PIN-gated /api/me/*       ──► SQLite (better-sqlite3)
                ────►  Telegram polling (optional)
```

- **AI loop:** OpenAI-compatible chat completion + tool calling. 13 tools
  registered today (health score, IDX, crypto, insurance, OJK, loans,
  market, allocation, fraud guide). Loop caps at 8 iterations.
- **Persistence:** `better-sqlite3` with four tables (user, health_snapshot,
  holding, buffer). Gracefully falls back to in-memory when not installed.
- **Security:** Personal endpoints require `x-vnansial-pin` header matching
  `VNANSIAL_PIN` env. The Asisten cannot read your portfolio without you
  unlocking it in the same browser session.

---

## Slide 6 — The Wellness Score (anchor feature)

**Why we built this:** scattered tools don't change behaviour. A single
score does.

Inputs (5 numbers):
1. Monthly income
2. Monthly expense
3. Emergency fund saldo
4. Total debt
5. Monthly savings

Output: a **0–100 score** from four pillars (each capped at 25 pts):

- **Budget** — expense ÷ income ratio (50/30/20 rule)
- **Emergency Fund** — months of expenses covered (target 6 months)
- **Debt** — total debt ÷ annual income (target ≤ 36%)
- **Savings** — savings rate ÷ income (target ≥ 20%)

Plus 1–4 personalised, immediately-actionable recommendations.

Same scorer powers:
- The web page (instant feedback, localStorage)
- The AI assistant (via the `score_financial_health` tool)
- The Telegram bot (`/score` command)

---

## Slide 7 — AI Asisten in action

Three example user journeys, all sub-second after the first tool call:

**"Cek dulu, apakah Quotex legal?"**
→ tool: `check_investment_company({ companyName: "quotex" })`
→ response: "Quotex tidak terdaftar OJK / Bappebti — kemungkinan illegal binary options. Jangan transfer. Lapor 157."

**"Saya 32 tahun, gaji 8 juta, 2 anak, belum punya asuransi. Saran?"**
→ tool: `recommend_insurance({ age: 32, monthlyIncome: 8000000, dependents: 2, hasHealth: false })`
→ tool: `calculate_insurance_premium({ type: "jiwa", coverage: 480000000, age: 32 })`
→ response: 4 prioritised actions with premium estimates in IDR.

**"Berapa risiko scam $PEPE?"**
→ tool: `get_crypto_quote({ id: "pepe" })`
→ tool: `assess_crypto_scam_risk({ id: "pepe" })`
→ response: risk score 0–100 with red-flag list.

---

## Slide 8 — Self-host story

Vnansial is intentionally simple to run on your own:

```bash
git clone …
cp .env.example .env       # paste SUMOPOD_API_KEY or any OpenAI-compatible key
npm install
npm install better-sqlite3 # optional, enables persistence
npm run build && npm start # serves both web + API on :3001
```

Or with Docker:

```bash
docker compose up -d
```

`DEPLOYMENT.md` covers Sumopod VPS, Jetorbit VPS, Docker, generic Ubuntu
with systemd + nginx + Let's Encrypt, and the Telegram bot wiring.

Why this matters: an Indonesian high-school computer club, a fintech
education NGO, or a bank's CSR team can fork Vnansial, swap the logo,
plug in their own data, and run it for thousands of users on a $5 VPS.

---

## Slide 9 — Distribution

- **Web** — https://vnansial.mukhayyar.my.id (primary)
- **Telegram bot** — `/score`, `/quote`, `/crypto`, `/emiten`, `/ask`
  commands. The same AI brain, accessible from a chat people already use.
- **Open source** — `Apache 2.0`. Self-hosters bring their own AI key.
- **Contribute** — `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`,
  `ARCHITECTURE.md` make it AI-agent friendly: Cursor, Aider, Claude
  Code, Gemini CLI, etc. all get the same brief.

---

## Slide 10 — Business model (if needed)

Not the focus for an Agenthon, but the path is clear:

- **Freemium SaaS:** Cek Kesehatan + basic tools free. Premium = scheduled
  alerts (price/regulatory), Telegram-push reminders, family accounts.
- **B2B:** Bank/fintech CSR partnerships — co-branded version, white-label
  for financial literacy programs.
- **Government:** OJK / Bank Indonesia could fund a public-good edition
  with official Satgas Waspada Investasi feeds.

---

## Slide 11 — Roadmap (post-hackathon)

- [ ] Live Satgas Waspada Investasi CSV ingest (SQLite-backed)
- [ ] Bond marketplace (FR/SBN) data
- [ ] Multi-agent orchestrator (planner + verifier + writer)
- [ ] Family / household profiles
- [ ] PWA install + push notifications
- [ ] Bahasa Jawa / Sunda localisation

---

## Slide 12 — Team & ask

**Team BRBSolo** — small but resolute.

**Ask:**
- Feedback from the OpenClaw judges.
- Connections to OJK / Satgas Waspada Investasi for official data.
- Help spreading the demo URL to financial-education NGOs.

**CTA:**
- Try the demo: **https://vnansial.mukhayyar.my.id/**
- Star the repo: **github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial**
- Read the contributor guide: `CLAUDE.md`

---

## Talking Points (60-second pitch)

> Indonesia loses 139 trillion rupiah a year to investment scams while
> half the population still struggles with financial literacy. Vnansial
> is a calm, Apple-styled web app and AI assistant that gives every
> Indonesian one place to check IDX stocks, watch crypto risk, compare
> insurance, plan a budget, and verify whether a "killer investment
> opportunity" is actually OJK-licensed. Everything is bilingual-aware
> (Bahasa Indonesia first), open source, self-hostable on a $5 VPS, and
> ships with a Telegram bot so the same AI can answer from people's
> phones. We default to SumoPod's Indonesian inference, but the OpenAI
> SDK shim means schools, NGOs, and banks can run it with whatever model
> they trust. The wellness score is the anchor metric — five numbers,
> one verdict, four actionable next steps. That's how we move literacy
> from a survey question to a daily habit.

---

## Environment cheatsheet (for live demos)

| Variable | Required | Notes |
|----------|----------|-------|
| `SUMOPOD_API_KEY` | yes (or any OpenAI-compatible) | Default provider. |
| `SUMOPOD_BASE_URL` | optional | Override to point at OpenAI / OpenRouter / local Ollama. |
| `SUMOPOD_MODEL` | optional | Default `qwen3.6-flash`. |
| `VNANSIAL_PIN` | optional | Locks `/api/me/*` (portfolio + health history). Recommended. |
| `TELEGRAM_BOT_TOKEN` | optional | Activates the Telegram bot. |
| `VNANSIAL_DB_PATH` | optional | SQLite path, default `server/data/vnansial.db`. |
| `YAHOO_MOCK=1` | CI only | Deterministic fixtures. |
