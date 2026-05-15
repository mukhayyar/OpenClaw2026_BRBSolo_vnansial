import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  {
    icon: '🤖',
    title: 'Asisten AI',
    desc: 'Chat dengan AI yang bisa cek investasi, hitung pinjaman, dan jadwalkan konten edukasi via Repliz.',
    path: '/asisten',
    color: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/30',
  },
  {
    icon: '🔍',
    title: 'Cek Investasi',
    desc: 'Verifikasi apakah perusahaan investasi terdaftar di OJK. Hindari investasi bodong.',
    path: '/cek-investasi',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30',
  },
  {
    icon: '🧮',
    title: 'Kalkulator Pinjaman',
    desc: 'Bandingkan pinjaman wajar vs predator. Lihat bunga tersembunyi sebelum terjebak.',
    path: '/kalkulator',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
  },
  {
    icon: '📚',
    title: 'Edukasi Keuangan',
    desc: 'Belajar keuangan dengan cara seru. Quiz, tips, dan panduan dalam bahasa sederhana.',
    path: '/edukasi',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
  },
  {
    icon: '🛡️',
    title: 'Lapor Penipuan',
    desc: 'Panduan langkah demi langkah untuk melapor ke OJK, BI, dan kepolisian.',
    path: '/lapor',
    color: 'from-red-500/20 to-red-500/5',
    border: 'border-red-500/30',
  },
]

const stats = [
  { num: '5,000+', label: 'Investasi Ilegal Diblokir OJK (2020–2025)' },
  { num: 'Rp 139T', label: 'Kerugian Masyarakat dari Investasi Bodong' },
  { num: '45%', label: 'Rakyat Indonesia Literasi Keuangan Rendah' },
]

const fade = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
}

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              100% Gratis — Untuk Semua Rakyat Indonesia
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Jangan Sampai{' '}
              <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
                Uangmu Hilang
              </span>
              <br />
              Karena{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Kurang Informasi
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Cek investasi bodong, hitung pinjaman predator, dan lindungi dirimu dari penipuan keuangan.
              Semua alat yang kamu butuhkan, gratis dan mudah dipahami.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/cek-investasi"
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
              >
                🔍 Cek Investasi Sekarang
              </Link>
              <Link
                to="/asisten"
                className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all"
              >
                🤖 Tanya Asisten AI
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
              className="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="text-3xl font-extrabold text-amber-400 mb-2">{s.num}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Alat yang Kamu Butuhkan</h2>
          <p className="text-slate-400">Lima fitur utama untuk melindungi keuanganmu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.path}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
            >
              <Link
                to={f.path}
                className={`block p-6 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} hover:scale-[1.02] transition-all group`}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Warning banner */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-red-400 mb-2">Waspada Penipuan!</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Jika seseorang menjanjikan keuntungan pasti lebih dari 2% per bulan tanpa risiko,
            kemungkinan besar itu <strong className="text-red-400">PENIPUAN</strong>.
            Tidak ada investasi yang bebas risiko.
          </p>
        </div>
      </section>
    </>
  )
}
