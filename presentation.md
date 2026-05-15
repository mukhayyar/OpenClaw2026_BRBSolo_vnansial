# Vnansial — Pitch Deck Source

> Gunakan dokumen ini sebagai prompt untuk AI slide generator (Gamma, Beautiful.ai, dll).

## Slide 1 — Judul

**Vnansial** — Literasi keuangan & perlindungan penipuan untuk semua rakyat Indonesia  
Tagline: *Jangan sampai uangmu hilang karena kurang informasi*  
100% gratis · Bahasa Indonesia · Mobile-first

## Slide 2 — Masalah

- **45%** literasi keuangan rendah (data BI/OJK, konteks nasional)
- **Rp 139 triliun** kerugian masyarakat dari investasi bodong
- **5.000+** entitas investasi ilegal diblokir OJK (2020–2025)
- Pinjol ilegal, binary options, skema ponzi marak di media sosial

## Slide 3 — Solusi

Platform web **Vnansial** dengan 6 pilar:

1. **Cek Investasi** — verifikasi entitas (demo DB OJK / SWI)
2. **Kalkulator Pinjaman** — bandingkan bunga wajar vs predator
3. **Edukasi** — quiz & tips keuangan sederhana
4. **Lapor Penipuan** — panduan OJK, polisi, blokir rekening
5. **Rencana Investasi** — kutipan pasar (Yahoo) & simulasi tabungan edukatif
6. **Asisten AI** — chat dengan **tool calling** (SumoPod)

## Slide 4 — Demo / Product

- UI dark modern, glass / Web3-inspired, Tailwind, React 19, Vite
- **Asisten AI** memanggil tools: cek OJK, hitung cicilan, red flag, quote pasar, simulasi target
- **Floating chat** di semua halaman + halaman penuh `/asisten`
- Deploy: Docker (Node serves static + API) atau `npm run dev` lokal

## Slide 5 — Teknologi

| Layer | Stack |
|-------|--------|
| Frontend | React, React Router, Framer Motion, Tailwind 4 |
| AI | OpenAI SDK → **SumoPod** (`qwen3.6-flash`) |
| Agent | Custom tool-calling loop (max 8 iterasi) |
| Market | **Yahoo Finance** via `yahoo-finance2` |
| Infra | Express 5, Docker, Vitest, GitHub Actions |

## Slide 6 — AI Agent & Tool Calling

Alur:

1. User chat di `/asisten`
2. Server `POST /api/agent/chat`
3. Model memilih tools: `check_investment_company`, `calculate_loan`, `get_market_quote`, dll.
4. Hasil tool dikembalikan ke model → jawaban final bahasa Indonesia

**Keamanan:** disclaimer edukasi; tidak janjikan return; kredensial AI di `.env` (tidak di repo).

## Slide 7 — Rencana Investasi (Edukasi)

- Kutipan delayed dari Yahoo Finance (US & `.JK`)
- Simulasi target tabungan & alokasi aset (konservatif / seimbang / agresif)
- **Bukan** saran investasi berlisensi OJK

## Slide 8 — Business Model (Hackathon Vision)

- Freemium: tools gratis, premium = alert investasi + AI pro
- B2B: kerjasama OJK/fintech untuk API resmi
- CSR bank: sponsor kampanye literasi keuangan

## Slide 9 — Traction / Next Steps

- [ ] Hubung API OJK / SWI live + Waspada SQLite
- [ ] Multi-agent orchestrator (`/agen`)
- [ ] Discover Challenges + Coach agent
- [ ] PWA + notifikasi push

## Slide 10 — Tim & Ask

**Tim:** BRBSolo · OpenClaw Agenthon 2026  
**Ask:** dukungan hackathon, akses data OJK, partnership SumoPod  
**CTA:** Coba demo → `npm run dev` · Repo: github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial

---

## Talking Points (30 detik)

"Vnansial adalah asisten literasi keuangan gratis. Kami gabungkan cek investasi ilegal, kalkulator pinjaman predator, dan agen AI yang memanggil tools secara otonom — plus simulasi tabungan dan kutipan pasar untuk edukasi, bukan janji profit."

## Env yang perlu diisi (untuk demo live)

- `SUMOPOD_API_KEY`
- `SUMOPOD_MODEL` (default `qwen3.6-flash`)
- `YAHOO_MOCK=1` hanya untuk CI/offline
