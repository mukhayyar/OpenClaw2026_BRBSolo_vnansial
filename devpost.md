# Devpost Submission Source — OpenClaw Agenthon 2026

> Copy-paste sections into [Devpost](https://devpost.com) for **OpenClaw Agenthon 2026**.  
> Team: **OpenClaw2026_BRBSolo** (BRB Solo) · Repo: [OpenClaw2026_BRBSolo_vnansial](https://github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial)

---

## 1. Project Name

**Vnansial — Autonomous AI Financial Guardian for Indonesia**

*(Short name: Vnansial)*

---

## 2. Team

**OpenClaw2026_BRBSolo** (BRB Solo)

---

## 3. Tagline / Elevator Pitch

**Short (one line):**  
*Jangan sampai uangmu hilang karena kurang informasi — Vnansial is your AI-powered financial guardian for Indonesia.*

**Medium (~50 words):**  
Vnansial is a free, Indonesian-language platform that helps everyday people avoid investment scams, predatory loans, and financial fraud. An AI agent powered by SumoPod (`qwen3.6-flash`) autonomously runs tools—OJK-style entity checks, loan calculators, fraud reporting guides, and investment planning with Yahoo Finance—so users get answers and actions, not generic chat.

---

## 4. Project Description (full narrative)

Millions of Indonesians lose money to illegal investments (*investasi bodong*), predatory lending (*pinjol*), and online fraud every year. Literacy is uneven; official data exists but is hard to search under pressure. **Vnansial** (*financial* + *guardian*) is a **platform helper** that combines practical tools with an **AI agent that calls real functions**—not a chatbot that guesses.

Users can verify entities against a demo OJK-style database, calculate whether a loan rate is fair or predatory, learn via quizzes, follow step-by-step fraud reporting, and ask complex questions in natural language on **Asisten AI**. In one request, the agent can chain multiple tools (e.g. check *Binomo* + calculate a loan + suggest reporting steps) without the user clicking through menus between steps.

We built for **OpenClaw Agenthon 2026** with a path toward a full **multi-agent orchestrator** (Investigator, Analyst, Guardian, Coach). The **shipping MVP** uses a single agent with an **autonomous tool-calling loop** (up to 8 LLM↔tool rounds per request) on SumoPod’s OpenAI-compatible API, plus a dedicated **Rencana Investasi** page with market quotes and savings simulations.

The UI uses a futuristic glass / Web3-inspired design with a floating AI chat widget, agent activity toasts, and a dedicated full-screen chat at `/asisten`. The project is Docker-ready, documented for public deploy, and includes unit tests plus GitHub Actions CI (no live API keys in CI).

*Disclaimer: Vnansial is educational technology, not licensed financial or legal advice. Users should verify with OJK and authorities.*

---

## 5. Inspiration

- National headlines on *investasi bodong* and SWI/OJK warnings  
- Friends and family targeted by *pinjol* and binary-option apps  
- Hackathon focus on **autonomous agents** that *do work*, not just talk  
- Indonesia-first UX: Bahasa Indonesia, mobile-friendly, free access  

---

## 6. What it does

- **Landing** — problem stats, feature cards, CTA to tools and AI  
- **Cek Investasi** — search demo licensed/illegal entities + interactive red-flag checklist  
- **Kalkulator Pinjaman** — anuitas / flat loan math with fair / warning / predatory verdict  
- **Edukasi** — financial literacy quiz and tips  
- **Lapor Penipuan** — guided steps (OJK 157, police, block accounts)  
- **Asisten AI** — SumoPod agent with tools: investment check, loan calc, red flags, fraud guide, market quotes, goal planner  
- **Rencana Investasi** — Yahoo Finance quotes, allocation simulator, paper portfolio (educational)  
- **Floating AI chat** — glass drawer on all pages (links to full chat)  
- **API** — `GET /api/health`, `GET /api/agent/test`, `POST /api/agent/chat`  
- **Futuristic UI** — glassmorphism, mesh background, agent ticker, mock wallet modal, tool-execution toasts  

**Roadmap (not all shipped in repo):** multi-agent `/agen` + `POST /api/agent/run`, Waspada Investasi SQLite (~11k rows), Discover Challenges, money psychology & judi-prevention pages.

---

## 7. How we built it

| Layer | Choice |
|-------|--------|
| Frontend | React 19, React Router 7, Framer Motion, Tailwind CSS 4, Vite 8 |
| Backend | Express 5 (ESM), `dotenv`, CORS |
| AI | OpenAI Node SDK → **SumoPod** `https://ai.sumopod.com/v1`, model **`qwen3.6-flash`** |
| Agent | Custom loop in `server/agent/loop.js` — tools defined in `server/tools/definitions.js`, executed via `runner.js` |
| Market data | Yahoo Finance via `yahoo-finance2` (mock in CI) |
| Data (demo) | `server/data/ojk.js` — small Map of sample entities |
| Deploy | Docker: build Vite `dist/`, Node serves static + API on port 3001 |
| Quality | Vitest tests (`tests/server/*`), GitHub Actions `.github/workflows/ci.yml` |

---

## 8. Challenges we ran into

- **SumoPod / Qwen tool calling** — needed sequential tool execution and normalized `tool` role messages for compatibility  
- **Hackathon scope vs. time** — multi-agent orchestrator designed but MVP shipped as single agent + rich tool registry first  
- **Real OJK data** — full Waspada CSV import planned; demo Map used for reliable live demo  
- **Yahoo Finance** — rate limits and delayed data; `YAHOO_MOCK=1` for CI  
- **Clean git history** — reset to single sprint commit for judge compliance  

---

## 9. Accomplishments we're proud of

- End-to-end **tool-calling agent** in Bahasa Indonesia on SumoPod  
- **Compound autonomous requests** — one user message triggers multiple tools without manual steps  
- Polished **glass / Web3 UI** with floating chat and on-chain-style tool activity feed  
- **Investment planning** page with live (delayed) market quotes and educational simulations  
- Reproducible **README**, pitch sources, `.plan/` handoff docs, CI workflow  
- Honest architecture docs separating **shipped** vs **planned**  

---

## 10. What we learned

- Judges care about **visible autonomy** — show tool trace, not only final text  
- Flash models need careful loop design (sequential tools, clear errors)  
- Financial AI requires **disclaimers** and refusal to promise returns  
- Platform helpers beat single-purpose calculators when an agent ties them together  

---

## 11. What's next

- **Multi-agent orchestrator** — `POST /api/agent/run`, `/agen` UI with agent trace  
- **Waspada Investasi SQLite** — import OJK alert CSV, `GET /api/investasi/search`  
- **Discover Challenges** — gamified goals + Coach agent + prompt packs  
- Pages: **money psychology**, **judi online prevention**  
- Live OJK/SWI API partnership, PWA, regional languages  

---

## 12. Built with

`React` · `TypeScript` · `Vite` · `Tailwind CSS` · `Framer Motion` · `Node.js` · `Express` · `OpenAI SDK` · `SumoPod` · `qwen3.6-flash` · `yahoo-finance2` · `Docker` · `Vitest` · `GitHub Actions`

---

## 13. AI Tools / Models Used

| Tool | Use |
|------|-----|
| **SumoPod** | OpenAI-compatible API host |
| **qwen3.6-flash** | Default chat + tool-calling model (`SUMOPOD_MODEL`) |
| **Tool calling** | 8 functions: investment check, loan calc, red flags, fraud guide, market quote/search, goal planner, allocation |
| **Agent loop** | Up to 8 autonomous LLM↔tool iterations per `/api/agent/chat` request |
| **Yahoo Finance** | Delayed quotes for educational investment planning (mocked in CI) |

No ChatGPT consumer app in production path; development may use Cursor/Claude for code.

---

## 14. OpenClaw Compliance (for judges)

| Requirement | How Vnansial addresses it |
|-------------|---------------------------|
| **Tool calling** | ✅ OpenAI-style `tools` + `tool` messages in `server/agent/loop.js` |
| **Autonomous loop** | ✅ **Partial (shipped):** within one API request, agent calls tools repeatedly until it returns text (max 8 rounds). **Planned:** goal-based `POST /api/agent/run` with no mid-flight user clicks |
| **Multi-agent** | ⏳ **Designed, not fully shipped:** Orchestrator + Investigator / Analyst / Guardian / Coach documented in README & pitch; MVP = single agent with all tools |
| **Not a basic chatbot** | ✅ Invokes calculators, lookups, guides, market/planner tools with logged `toolCalls` |
| **Public deployable** | ✅ Docker + README deploy section; live URL TBD on Devpost |

**Best demo for judges:** On `/asisten`, send one compound prompt: *"Cek Binomo, hitung pinjaman 5 juta bunga 24% 12 bulan, dan ringkas langkah lapor jika tertipu."* Expand tool trace / watch toasts.

---

## 15. Links

| Item | URL |
|------|-----|
| **GitHub** | https://github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial |
| **Live demo** | [TBD — add Render/Fly URL before submit] |
| **Demo video** | [TBD — YouTube unlisted] |
| **Pitch deck PDF** | [TBD — max 5 slides; use `presentation.md` subset] |

---

## 16. Demo video script (≤ 2 minutes)

| Time | Shot | Audio (ID / EN mix) |
|------|------|---------------------|
| 0:00–0:15 | Landing hero, mesh UI, ticker "Powered by AI Agents" | *"Di Indonesia, triliunan rupiah hilang karena investasi bodong dan penipuan. Vnansial adalah platform helper gratis dengan agen AI."* |
| 0:15–0:35 | Cek Investasi: type "Binomo" → illegal result; red flags | *"Cek entitas dan red flag sebelum transfer."* |
| 0:35–0:55 | Kalkulator: predatory rate → verdict | *"Kalkulator mengekspos bunga predator."* |
| 0:55–1:25 | `/asisten`: compound prompt; show tool chain / toasts; final answer | *"Bukan chatbot biasa—agen memanggil tools secara otonom: cek investasi, hitung pinjaman, panduan lapor."* |
| 1:25–1:45 | Rencana Investasi: quote `BBCA.JK`, goal simulator | *"Simulasi tabungan dan kutipan pasar untuk edukasi — bukan saran berlisensi."* |
| 1:45–2:00 | Architecture slide or README diagram; GitHub + live URL | *"OpenClaw2026 BRBSolo — Vnansial. Repo dan demo di Devpost."* |

**Recording tips:** 1080p browser, dark mode, no API keys on screen, `npm run dev` running.

---

## 17. Submission checklist

- [ ] Repo name: `OpenClaw2026_BRBSolo_vnansial`  
- [ ] GitHub link works; README has Quick Start  
- [ ] **Deadline: 15 Mei 2026, 23:00 WIB** — no commits after deadline (organizer rules)  
- [ ] Devpost: description, built-with tags, thumbnail  
- [ ] **Video** uploaded (≤ 3 min if limit allows; script targets 2 min)  
- [ ] **Live demo URL** — `curl /api/health` returns `ok: true`  
- [ ] PDF pitch deck ≤ 5 slides (see `presentation.md` → Submission subset)  
- [ ] Confirm autonomous demo works with `SUMOPOD_API_KEY` on host  
- [ ] Team registered as BRBSolo / OpenClaw2026_BRBSolo  

---

## 18. Optional: Best Payment Use Case (Doku track)

Vnansial can extend to **safe payment education**: the agent explains e-wallet and QRIS fraud patterns, simulates whether a payment link is suspicious, and guides users to verify merchant identity before paying—without processing live payments in the hackathon MVP. Future integration with **Doku** or bank APIs could power verified merchant lookup and escrow-style literacy flows for marketplace scams. *MVP focuses on prevention and reporting, not moving money.*

---

## License

**Apache License 2.0** — Copyright © 2026 **BRBSolo**. Source code: [LICENSE](https://github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial/blob/main/LICENSE) in the repository.

---

## Related docs

- Pitch deck source: `presentation.md`  
- Technical README: `README.md`  
- Sprint handoff: `.plan/00-index.plan`
