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

Platform web **Vnansial** dengan 5 pilar:

1. **Cek Investasi** — verifikasi entitas (demo DB OJK / SWI)
2. **Kalkulator Pinjaman** — bandingkan bunga wajar vs predator
3. **Edukasi** — quiz & tips keuangan sederhana
4. **Lapor Penipuan** — panduan OJK, polisi, blokir rekening
5. **Asisten AI** — chat dengan **tool calling** (SumoPod) + otomasi sosmed (**Repliz Gold**)

## Slide 4 — Demo / Product

- UI dark modern, Tailwind, React 19, Vite
- **Asisten AI** memanggil tools: cek OJK, hitung cicilan, red flag, jadwal posting literasi
- Integrasi **Repliz API** (`api.repliz.com/public`) untuk schedule konten edukasi ke Instagram/TikTok/dll
- Deploy: Docker (nginx static + Node API) atau `npm run dev` lokal

## Slide 5 — Teknologi

| Layer | Stack |
|-------|--------|
| Frontend | React, React Router, Framer Motion, Tailwind 4 |
| AI | OpenAI SDK → **SumoPod** (`gpt-4o-mini`) |
| Agent | Custom tool-calling loop (max 8 iterasi) |
| Sosmed | **Repliz** REST + Basic Auth |
| Infra | Express 5, Docker, nginx |

## Slide 6 — AI Agent & Tool Calling

Alur:

1. User chat di `/asisten`
2. Server `POST /api/agent/chat`
3. Model memilih tools: `check_investment_company`, `calculate_loan`, `repliz_schedule_literacy_post`, dll.
4. Hasil tool dikembalikan ke model → jawaban final bahasa Indonesia

**Keamanan:** Repliz posting hanya jika user eksplisit minta; kredensial di `.env` (tidak di repo).

## Slide 7 — Repliz (Gold) — Why It Matters

- Satu API untuk multi-platform scheduling
- Vnansial bisa **menyebarkan edukasi literasi keuangan** otomatis setelah user setuju
- Hackathon differentiator: finlit + growth loop sosial

## Slide 8 — Business Model (Hackathon Vision)

- Freemium: tools gratis, premium = alert investasi + AI pro
- B2B: kerjasama OJK/fintech untuk API resmi
- CSR bank: sponsor edukasi via Repliz campaigns

## Slide 9 — Traction / Next Steps

- [ ] Hubung API OJK / SWI live
- [ ] KYC ringan untuk laporan penipuan teranonim
- [ ] Bahasa daerah (Sunda, Jawa) via model
- [ ] PWA + notifikasi push

## Slide 10 — Tim & Ask

**Tim:** [isi nama]  
**Ask:** dukungan hackathon, akses data OJK, partnership Repliz/SumoPod  
**CTA:** Coba demo → `npm run dev` · Repo: github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial

---

## Talking Points (30 detik)

"Vnansial adalah asisten literasi keuangan gratis. Kami gabungkan cek investasi ilegal, kalkulator pinjaman predator, dan AI yang bisa menjadwalkan konten edukasi ke media sosial lewat Repliz — supaya tips keuangan tidak hanya di website, tapi sampai ke feed yang sering jadi tempat penipuan."

## Env yang perlu diisi (untuk demo live)

- `SUMOPOD_API_KEY`
- `REPLIZ_USERNAME` + `REPLIZ_PASSWORD` (opsional, untuk fitur sosmed)
