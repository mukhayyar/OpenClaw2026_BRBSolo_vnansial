import { useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'

function CekTools() {
  const [rek, setRek] = useState('')
  const [bank, setBank] = useState('BCA')
  const [hp, setHp] = useState('')

  function openCekRekening() {
    // cekrekening.id pre-fill via query string when supported; otherwise open landing
    const params = new URLSearchParams()
    if (rek) params.set('account_number', rek)
    if (bank) params.set('bank_code', bank)
    const url = params.toString()
      ? `https://cekrekening.id/cek-rekening?${params.toString()}`
      : 'https://cekrekening.id/cek-rekening'
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function openAduanNomor() {
    const params = new URLSearchParams()
    if (hp) params.set('q', hp)
    const url = params.toString()
      ? `https://aduannomor.id/cek-nomor-seluler?${params.toString()}`
      : 'https://aduannomor.id/cek-nomor-seluler'
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
      <Bento padding="lg" tone="cream">
        <p className="vn-eyebrow mb-3">Cek rekening</p>
        <h3 className="vn-headline text-[20px] mb-2">Curiga rekening tujuan transfer?</h3>
        <p className="text-[13px] text-[var(--vn-ink-soft)] mb-4 leading-relaxed">
          Cek apakah nomor rekening pernah dilaporkan sebagai penipuan di database{' '}
          <a className="underline text-[var(--vn-forest)]" href="https://cekrekening.id" target="_blank" rel="noopener noreferrer">
            cekrekening.id
          </a>{' '}
          (Kemenkominfo).
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-2 mb-3">
          <input
            value={rek}
            onChange={e => setRek(e.target.value.replace(/\D/g, ''))}
            placeholder="Nomor rekening (angka saja)"
            className="vn-input"
            inputMode="numeric"
          />
          <select value={bank} onChange={e => setBank(e.target.value)} className="vn-input !w-28">
            <option>BCA</option>
            <option>BRI</option>
            <option>BNI</option>
            <option>MANDIRI</option>
            <option>CIMB</option>
            <option>BSI</option>
            <option>PERMATA</option>
            <option>DANAMON</option>
            <option>MEGA</option>
            <option>BTN</option>
          </select>
        </div>
        <button onClick={openCekRekening} className="vn-btn vn-btn-primary">
          Buka di cekrekening.id ↗
        </button>
        <p className="mt-3 text-[11px] text-[var(--vn-muted)]">
          Sumber: cekrekening.id (Kementerian Kominfo). Kami tidak menyimpan datamu.
        </p>
      </Bento>

      <Bento padding="lg" tone="mint">
        <p className="vn-eyebrow mb-3">Cek nomor HP</p>
        <h3 className="vn-headline text-[20px] mb-2">Nomor asing kirim WhatsApp tipu-tipu?</h3>
        <p className="text-[13px] text-[var(--vn-ink-soft)] mb-4 leading-relaxed">
          Cek apakah nomor sudah masuk laporan publik di{' '}
          <a className="underline text-[var(--vn-forest)]" href="https://aduannomor.id" target="_blank" rel="noopener noreferrer">
            aduannomor.id
          </a>.
        </p>
        <input
          value={hp}
          onChange={e => setHp(e.target.value)}
          placeholder="08xx-xxxx-xxxx"
          className="vn-input mb-3"
        />
        <button onClick={openAduanNomor} className="vn-btn vn-btn-primary">
          Buka di aduannomor.id ↗
        </button>
        <p className="mt-3 text-[11px] text-[var(--vn-muted)]">
          Sumber: aduannomor.id (Kementerian Kominfo / BRTI).
        </p>
      </Bento>
    </div>
  )
}

const STEPS = [
  {
    title: 'Kumpulkan bukti',
    items: [
      'Screenshot semua percakapan (WhatsApp, DM, email)',
      'Catat nomor rekening penerima transfer',
      'Simpan bukti transfer & mutasi rekening',
      'Screenshot website/aplikasi penipu',
      'Catat nama, nomor HP, dan media sosial penipu',
      'Rekam voice note atau video call jika ada',
    ],
  },
  {
    title: 'Lapor ke OJK',
    items: [
      'Hubungi OJK di 157 (Sen–Jum 08:00–17:00)',
      'WhatsApp 081-157-157-157',
      'Email konsumen@ojk.go.id',
      'Online di konsumen.ojk.go.id/FormPengaduan',
      'Sertakan semua bukti yang dikumpulkan',
      'Minta nomor tiket pengaduan',
    ],
  },
  {
    title: 'Lapor ke polisi',
    items: [
      'Datang ke kantor polisi terdekat (SPKT)',
      'Atau lapor online di patrolisiber.id',
      'Bawa KTP dan bukti',
      'Minta Surat Tanda Penerimaan Laporan (STPL)',
      'Catat nomor LP (Laporan Polisi)',
      'Follow up minimal 2 minggu sekali',
    ],
  },
  {
    title: 'Blokir & laporkan',
    items: [
      'Hubungi bank penerima transfer',
      'Laporkan ke cekrekening.id',
      'Laporkan ke aduankonten.id (Kemenkominfo)',
      'Blokir nomor HP penipu di HP kamu',
      'Laporkan akun media sosial penipu',
    ],
  },
  {
    title: 'Lindungi diri',
    items: [
      'Ganti password semua akun yang terkait',
      'Aktifkan 2FA',
      'Pantau mutasi rekening secara rutin',
      'Cek SLIK (BI Checking) untuk pinjaman atas namamu',
      'Lapor ke Dukcapil jika KTP bocor',
    ],
  },
]

const HOTLINES = [
  { name: 'OJK', number: '157', desc: 'Pengaduan investasi & jasa keuangan', hours: 'Sen–Jum 08:00–17:00' },
  { name: 'Bank Indonesia', number: '131', desc: 'Sistem pembayaran & uang palsu', hours: 'Sen–Jum 08:00–16:00' },
  { name: 'Patroli Siber', number: '(021) 7218-0885', desc: 'Cybercrime & penipuan online', hours: '24 jam' },
  { name: 'Kemenkominfo', number: '159', desc: 'Aduan konten & nomor telepon', hours: 'Sen–Jum 08:00–16:00' },
  { name: 'LBH', number: '(021) 390-4226', desc: 'Bantuan hukum gratis', hours: 'Sen–Jum 09:00–16:00' },
]

const TEMPLATES = [
  {
    title: 'Template laporan OJK',
    content: `Yth. Otoritas Jasa Keuangan,

Saya [NAMA LENGKAP], NIK [NOMOR KTP], berdomisili di [ALAMAT], melaporkan dugaan penipuan oleh:

Nama/Platform: [NAMA]
Nomor Rekening: [NOMOR]
Bank: [BANK]
Jumlah Kerugian: Rp [JUMLAH]
Kronologi: [URAIKAN]

Bukti terlampir:
1. Screenshot percakapan
2. Bukti transfer
3. [LAINNYA]

Mohon ditindaklanjuti.

[NAMA] · [NO. HP] · [EMAIL]`,
  },
  {
    title: 'Template laporan polisi',
    content: `Kepada Yth. Kepala Kepolisian [POLSEK/POLRES],

Yang bertanda tangan di bawah ini:
Nama: [NAMA]
NIK: [NOMOR KTP]
Alamat: [ALAMAT]
HP: [NOMOR]

Melaporkan tindak pidana penipuan (Pasal 378 KUHP dan/atau UU ITE Pasal 28 ayat 1) oleh:

Terlapor: [NAMA/PLATFORM]
Kerugian: Rp [JUMLAH]

Kronologi:
[LENGKAP]

Bukti pendukung terlampir.

[KOTA], [TANGGAL]
[NAMA & TANDA TANGAN]`,
  },
]

export default function LaporPenipuan({ embedded = false }: { embedded?: boolean } = {}) {
  const [activeStep, setActiveStep] = useState(0)
  const [showTemplate, setShowTemplate] = useState<number | null>(null)

  const body = (
    <>
      <Bento padding="lg" className="mb-6" tone="ink">
        <p className="vn-eyebrow !text-[var(--vn-mint)] mb-3">Baru tertipu?</p>
        <h3 className="vn-headline text-[24px] sm:text-[28px] mb-3 text-white">
          Hubungi OJK 157 dan bank kamu sekarang.
        </h3>
        <p className="text-white/80 text-[14.5px] leading-relaxed max-w-2xl">
          Waktu adalah segalanya — makin cepat kamu lapor, makin besar peluang dana
          bisa dibekukan sebelum dipindahkan.
        </p>
      </Bento>

      <CekTools />

      {/* Steps */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-12">
        {STEPS.map((step, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setActiveStep(activeStep === i ? -1 : i)}
            className={`bento bento-pad text-left ${
              activeStep === i ? 'bento-cream' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="w-10 h-10 rounded-2xl grid place-items-center vn-headline text-[18px]"
                style={{ background: 'var(--vn-cream)', color: 'var(--vn-forest-dark)' }}
              >
                {i + 1}
              </span>
              <p className="vn-headline text-[18px]">{step.title}</p>
            </div>
            {activeStep === i && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5 mt-3"
              >
                {step.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-[14px] text-[var(--vn-ink-soft)] flex items-start gap-2"
                  >
                    <span className="text-[var(--vn-forest)] mt-1">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </motion.button>
        ))}
      </div>

      <Bento padding="lg" className="mb-6">
        <p className="vn-eyebrow mb-3">Nomor penting</p>
        <h3 className="vn-headline text-[22px] mb-5">Hotline yang bisa kamu hubungi.</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {HOTLINES.map(h => (
            <div key={h.name} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--vn-bg-deep)]">
              <div className="text-center min-w-[90px]">
                <div className="vn-headline text-[18px] text-[var(--vn-forest-dark)]">{h.number}</div>
                <div className="text-[10px] text-[var(--vn-muted)]">{h.hours}</div>
              </div>
              <div>
                <p className="font-semibold text-[13.5px]">{h.name}</p>
                <p className="text-[12px] text-[var(--vn-muted)]">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Bento>

      <Bento padding="lg">
        <p className="vn-eyebrow mb-3">Template laporan</p>
        <h3 className="vn-headline text-[22px] mb-5">Salin, sesuaikan, kirim.</h3>
        <div className="space-y-3">
          {TEMPLATES.map((t, i) => (
            <div key={i}>
              <button
                onClick={() => setShowTemplate(showTemplate === i ? null : i)}
                className="w-full text-left px-4 py-3 rounded-2xl bg-[var(--vn-bg-deep)] hover:bg-[var(--vn-cream)] transition-colors font-medium text-[14px] flex justify-between items-center"
              >
                {t.title}
                <span className="text-[var(--vn-muted)]">{showTemplate === i ? '▲' : '▼'}</span>
              </button>
              {showTemplate === i && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                  <pre className="p-4 rounded-2xl bg-white border border-[var(--vn-line)] text-[12px] text-[var(--vn-ink-soft)] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {t.content}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(t.content)}
                    className="mt-3 vn-btn vn-btn-secondary !py-2 !px-4 text-[13px]"
                  >
                    Salin template
                  </button>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </Bento>
    </>
  )

  if (embedded) return body
  return (
    <PageShell
      eyebrow="Perlindungan"
      title="Lapor cepat. Setiap menit menentukan."
      subtitle="Panduan praktis 5 langkah, nomor hotline penting, dan template laporan siap pakai."
    >
      {body}
    </PageShell>
  )
}
