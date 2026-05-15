import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import LandscapeHero from '../components/LandscapeHero'
import Bento from '../components/Bento'

const stats = [
  { num: 'Rp 139T', label: 'Kerugian masyarakat dari investasi bodong', sub: 'OJK 2020–2025' },
  { num: '5.000+', label: 'Entitas investasi ilegal diblokir', sub: 'Satgas Waspada Investasi' },
  { num: '49,7%', label: 'Indeks literasi keuangan Indonesia', sub: 'masih di bawah 50%' },
]

const features = [
  {
    to: '/kesehatan',
    eyebrow: 'Baru · sehat',
    title: 'Cek Kesehatan Finansial',
    desc: 'Skor 0–100 dari empat pilar: anggaran, dana darurat, hutang, dan tabungan. Lengkap dengan saran praktis.',
    tone: 'forest' as const,
    span: 'md:col-span-2 md:row-span-2',
    pad: 'lg' as const,
  },
  {
    to: '/cek-investasi',
    eyebrow: 'Verifikasi',
    title: 'Cek izin OJK',
    desc: 'Hindari investasi bodong dengan satu klik.',
    tone: 'cream' as const,
    span: '',
  },
  {
    to: '/kalkulator',
    eyebrow: 'Kalkulator',
    title: 'Bunga jujur',
    desc: 'Bandingkan KUR, KPR, pinjol, dan rentenir.',
    tone: 'mint' as const,
    span: '',
  },
  {
    to: '/rencana-investasi',
    eyebrow: 'Pertumbuhan',
    title: 'Rencana investasi',
    desc: 'Target tabungan, alokasi aset, harga pasar Yahoo Finance.',
    tone: 'white' as const,
    span: 'md:col-span-2',
  },
  {
    to: '/edukasi',
    eyebrow: 'Belajar',
    title: 'Edukasi keuangan',
    desc: 'Quiz singkat & tips harian.',
    tone: 'white' as const,
    span: '',
  },
  {
    to: '/lapor',
    eyebrow: 'Perlindungan',
    title: 'Lapor penipuan',
    desc: 'Langkah & template untuk lapor ke OJK, polisi, dan platform.',
    tone: 'deep' as const,
    span: '',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.55, ease: [0.2, 0.8, 0.2, 1] },
  }),
}

export default function Landing() {
  return (
    <>
      {/* Hero with landscape illustration */}
      <section className="vn-container pt-10 sm:pt-16">
        <div className="landscape-hero" style={{ minHeight: 580 }}>
          <div className="bento-pad-lg flex flex-col h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="max-w-3xl"
            >
              <span className="vn-chip mb-6">
                <span className="vn-dot vn-pulse" /> Untuk semua rakyat Indonesia · gratis
              </span>
              <h1 className="vn-display text-[44px] sm:text-[68px] lg:text-[80px] text-[var(--vn-ink)]">
                Tumbuh sehat <br />
                bersama <span className="vn-text-gradient">keuanganmu.</span>
              </h1>
              <p className="mt-6 text-[19px] sm:text-[21px] text-[var(--vn-ink-soft)] leading-relaxed max-w-2xl">
                Cek kesehatan finansial, verifikasi investasi, hitung pinjaman jujur, dan
                bicara dengan asisten AI yang ramah. Tanpa jargon. Tanpa biaya.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/kesehatan" className="vn-btn vn-btn-primary">
                  Mulai Cek Kesehatan
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/asisten" className="vn-btn vn-btn-secondary">
                  Tanya Asisten AI
                </Link>
              </div>
            </motion.div>
            <LandscapeHero height={260} />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="vn-container mt-12 sm:mt-20">
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="bento bento-pad"
            >
              <p className="vn-display text-[40px] sm:text-[48px] vn-text-gradient mb-1.5">{s.num}</p>
              <p className="text-[15px] text-[var(--vn-ink)] font-medium">{s.label}</p>
              <p className="text-[12px] text-[var(--vn-muted)] mt-1">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bento feature grid */}
      <section className="vn-container vn-section">
        <div className="max-w-3xl mb-12">
          <p className="vn-eyebrow mb-3">Yang kamu butuhkan</p>
          <h2 className="vn-display text-[36px] sm:text-[56px] leading-[1.05]">
            Satu tempat untuk <br /> melindungi keuanganmu.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[minmax(180px,auto)]">
          {features.map((f, i) => (
            <Bento
              key={f.to}
              tone={f.tone}
              padding={f.pad ?? 'md'}
              delay={i * 0.05}
              span={f.span}
              className="block group"
              as="a"
              href={f.to}
            >
              <p
                className={`vn-eyebrow mb-3 ${
                  f.tone === 'forest' || f.tone === 'ink' ? '!text-[var(--vn-mint)]' : ''
                }`}
              >
                {f.eyebrow}
              </p>
              <h3
                className={`vn-headline text-[22px] sm:text-[28px] mb-2 ${
                  f.tone === 'forest' || f.tone === 'ink' ? 'text-white' : 'text-[var(--vn-ink)]'
                }`}
              >
                {f.title}
              </h3>
              <p
                className={`text-[14.5px] leading-relaxed ${
                  f.tone === 'forest' || f.tone === 'ink'
                    ? 'text-white/85'
                    : 'text-[var(--vn-ink-soft)]'
                }`}
              >
                {f.desc}
              </p>
              <p
                className={`mt-5 text-[13px] font-semibold inline-flex items-center gap-1 ${
                  f.tone === 'forest' || f.tone === 'ink'
                    ? 'text-white'
                    : 'text-[var(--vn-forest)]'
                }`}
              >
                Buka
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </p>
            </Bento>
          ))}
        </div>
      </section>

      {/* Trust / mission */}
      <section className="vn-container pb-24">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <Bento tone="ink" padding="lg">
            <p className="vn-eyebrow !text-[var(--vn-mint)] mb-3">Misi</p>
            <h3 className="vn-headline text-[28px] sm:text-[36px] mb-4 text-white">
              Literasi keuangan bukan kemewahan. Itu hak.
            </h3>
            <p className="text-white/80 text-[15px] leading-relaxed">
              Vnansial gratis dan terbuka karena setiap rupiah yang dilindungi adalah
              rupiah yang bisa membiayai keluarga, pendidikan, dan masa depan.
            </p>
            <Link to="/edukasi" className="mt-6 inline-flex vn-btn vn-btn-on-dark">
              Pelajari lebih lanjut
            </Link>
          </Bento>
          <Bento tone="mint" padding="lg">
            <p className="vn-eyebrow mb-3">Hati-hati</p>
            <h3 className="vn-headline text-[24px] sm:text-[32px] mb-3">
              Jika dijanjikan untung pasti &gt;2% per bulan,{' '}
              <span className="text-[var(--vn-red)]">itu penipuan.</span>
            </h3>
            <p className="text-[var(--vn-ink-soft)] text-[15px] leading-relaxed">
              Tidak ada investasi yang bebas risiko. Hubungi <strong>OJK 157</strong> sebelum
              transfer ke siapa pun.
            </p>
          </Bento>
        </div>
      </section>
    </>
  )
}
