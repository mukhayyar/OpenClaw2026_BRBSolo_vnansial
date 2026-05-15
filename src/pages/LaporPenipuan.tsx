import { useState } from 'react'
import { motion } from 'framer-motion'

const STEPS = [
  {
    title: 'Kumpulkan Bukti',
    icon: '📸',
    items: [
      'Screenshot semua percakapan (WhatsApp, DM, email)',
      'Catat nomor rekening penerima transfer',
      'Simpan bukti transfer / mutasi rekening',
      'Screenshot website/aplikasi penipu',
      'Catat nama, nomor HP, dan akun media sosial penipu',
      'Rekam voice note / video call jika ada',
    ],
  },
  {
    title: 'Lapor ke OJK',
    icon: '🏛️',
    items: [
      'Hubungi OJK di 157 (Senin-Jumat, 08:00-17:00)',
      'Atau WhatsApp ke 081-157-157-157',
      'Atau email: konsumen@ojk.go.id',
      'Atau online: konsumen.ojk.go.id/FormPengaduan',
      'Sertakan semua bukti yang sudah dikumpulkan',
      'Minta nomor tiket pengaduan untuk tracking',
    ],
  },
  {
    title: 'Lapor ke Polisi',
    icon: '👮',
    items: [
      'Datang ke kantor polisi terdekat (SPKT)',
      'Atau lapor online: patrolisiber.id',
      'Bawa KTP dan semua bukti',
      'Minta Surat Tanda Penerimaan Laporan (STPL)',
      'Catat nomor LP (Laporan Polisi)',
      'Follow up minimal setiap 2 minggu',
    ],
  },
  {
    title: 'Blokir Rekening Penipu',
    icon: '🔒',
    items: [
      'Hubungi bank penerima transfer',
      'Minta pemblokiran rekening berdasarkan LP',
      'Hubungi juga Cekrekening.id untuk melaporkan',
      'Laporkan ke Kemenkominfo: aduankonten.id',
      'Blokir nomor HP penipu di HP kamu',
      'Laporkan akun media sosial penipu ke platform',
    ],
  },
  {
    title: 'Lindungi Diri',
    icon: '🛡️',
    items: [
      'Ganti password semua akun yang terkait',
      'Aktifkan 2FA (Two-Factor Authentication)',
      'Pantau mutasi rekening bank secara rutin',
      'Jika KTP bocor, lapor ke Dukcapil untuk pengawasan',
      'Cek SLIK (BI Checking) — pastikan tidak ada pinjaman atas namamu',
      'Ceritakan ke keluarga agar tidak ada korban lain',
    ],
  },
]

const HOTLINES = [
  { name: 'OJK', number: '157', desc: 'Pengaduan investasi & jasa keuangan', hours: 'Sen-Jum 08:00-17:00' },
  { name: 'Bank Indonesia', number: '131', desc: 'Sistem pembayaran & uang palsu', hours: 'Sen-Jum 08:00-16:00' },
  { name: 'Polisi (Patrolisiber)', number: '(021) 7218-0885', desc: 'Cybercrime & penipuan online', hours: '24 jam' },
  { name: 'Kemenkominfo', number: '159', desc: 'Aduan konten & nomor telepon', hours: 'Sen-Jum 08:00-16:00' },
  { name: 'LBH (Bantuan Hukum)', number: '(021) 390-4226', desc: 'Konsultasi hukum gratis', hours: 'Sen-Jum 09:00-16:00' },
]

const TEMPLATES = [
  {
    title: 'Template Laporan OJK',
    content: `Yth. Otoritas Jasa Keuangan,

Saya [NAMA LENGKAP], NIK [NOMOR KTP], berdomisili di [ALAMAT], dengan ini melaporkan dugaan penipuan investasi/pinjaman online ilegal oleh:

Nama/Platform: [NAMA PENIPU/PLATFORM]
Nomor Rekening: [NOMOR REKENING PENIPU]
Bank: [NAMA BANK]
Jumlah Kerugian: Rp [JUMLAH]
Kronologi Singkat: [CERITAKAN KRONOLOGI]

Bukti terlampir:
1. Screenshot percakapan
2. Bukti transfer
3. [BUKTI LAINNYA]

Mohon ditindaklanjuti. Terima kasih.

[NAMA]
[NOMOR HP]
[EMAIL]`,
  },
  {
    title: 'Template Laporan Polisi',
    content: `Kepada Yth. Kepala Kepolisian [POLSEK/POLRES],

Yang bertanda tangan di bawah ini:
Nama: [NAMA LENGKAP]
NIK: [NOMOR KTP]
Alamat: [ALAMAT LENGKAP]
No. HP: [NOMOR HP]

Melaporkan tindak pidana penipuan sebagaimana dimaksud Pasal 378 KUHP dan/atau UU ITE Pasal 28 ayat (1) yang dilakukan oleh:

Terlapor: [NAMA/PLATFORM PENIPU]
Kerugian: Rp [JUMLAH]

Kronologi:
[URAIKAN KRONOLOGI LENGKAP]

Bukti pendukung terlampir.

Demikian laporan ini saya buat dengan sebenar-benarnya.

[KOTA], [TANGGAL]
[NAMA & TANDA TANGAN]`,
  },
]

export default function LaporPenipuan() {
  const [activeStep, setActiveStep] = useState(0)
  const [showTemplate, setShowTemplate] = useState<number | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">🛡️ Lapor Penipuan</h1>
        <p className="text-slate-400 mb-8">
          Panduan langkah demi langkah untuk melapor dan melindungi diri dari penipuan keuangan.
        </p>

        {/* Emergency banner */}
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="font-bold text-red-400 mb-1">Baru saja tertipu?</h3>
              <p className="text-sm text-slate-400">
                Segera hubungi <strong className="text-white">157</strong> (OJK) dan bank kamu untuk
                memblokir transaksi. Waktu adalah segalanya — semakin cepat lapor, semakin besar
                kemungkinan uang bisa diselamatkan.
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setActiveStep(activeStep === i ? -1 : i)}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  activeStep === i
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      {step.icon} {step.title}
                    </div>
                  </div>
                  <span className="text-slate-500">{activeStep === i ? '▲' : '▼'}</span>
                </div>
              </button>

              {activeStep === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="ml-14 mt-2 space-y-2"
                >
                  {step.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Hotlines */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <h2 className="text-xl font-bold mb-4">📞 Nomor Penting</h2>
          <div className="space-y-3">
            {HOTLINES.map((h, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                <div className="text-center min-w-[80px]">
                  <div className="text-lg font-bold text-emerald-400">{h.number}</div>
                  <div className="text-[10px] text-slate-500">{h.hours}</div>
                </div>
                <div>
                  <div className="font-medium text-sm">{h.name}</div>
                  <div className="text-xs text-slate-500">{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-bold mb-4">📝 Template Laporan</h2>
          <p className="text-sm text-slate-400 mb-4">
            Salin dan sesuaikan template di bawah ini untuk mempercepat proses pelaporan.
          </p>
          <div className="space-y-3">
            {TEMPLATES.map((t, i) => (
              <div key={i}>
                <button
                  onClick={() => setShowTemplate(showTemplate === i ? null : i)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium text-sm flex justify-between items-center"
                >
                  {t.title}
                  <span className="text-slate-500">{showTemplate === i ? '▲' : '▼'}</span>
                </button>
                {showTemplate === i && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                    <pre className="p-4 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                      {t.content}
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(t.content)}
                      className="mt-2 px-4 py-2 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all font-medium"
                    >
                      📋 Salin Template
                    </button>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
