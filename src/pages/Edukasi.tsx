import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import KalkulatorPanel from './KalkulatorPanel'
import LaporPenipuan from './LaporPenipuan'

interface QuizQ {
  q: string
  options: string[]
  correct: number
  explain: string
}

const QUIZ: QuizQ[] = [
  {
    q: 'Seseorang menawarkan investasi dengan return 10% per bulan PASTI. Apa yang sebaiknya kamu lakukan?',
    options: ['Segera investasi sebelum kehabisan', 'Cek di OJK dan tolak jika tidak terdaftar', 'Ajak teman ikut juga', 'Pinjam uang untuk investasi'],
    correct: 1,
    explain: 'Return >2%/bulan yang dijanjikan adalah ciri investasi bodong. Selalu cek di sikapiuangmu.ojk.go.id.',
  },
  {
    q: 'Pinjaman online (pinjol) yang legal harus terdaftar di mana?',
    options: ['Kemenkominfo', 'OJK (Otoritas Jasa Keuangan)', 'Google Play Store', 'Bank Indonesia'],
    correct: 1,
    explain: 'Pinjol legal harus terdaftar dan diawasi OJK. Cek di ojk.go.id/id/kanal/iknb/financial-technology.',
  },
  {
    q: 'Apa itu skema Ponzi?',
    options: ['Sistem investasi legal dari Italia', 'Uang investor baru dipakai bayar investor lama', 'Saham yang harganya naik terus', 'Tabungan berjangka di bank'],
    correct: 1,
    explain: 'Skema Ponzi menggunakan uang investor baru untuk membayar return investor lama. Saat tidak ada investor baru, sistem runtuh.',
  },
  {
    q: 'Berapa batas maksimal bunga pinjol per hari menurut OJK?',
    options: ['0,1%/hari', '0,4%/hari', '1%/hari', 'Tidak ada batasan'],
    correct: 1,
    explain: 'OJK membatasi bunga pinjol maksimal 0,4%/hari dengan total bunga tidak boleh melebihi 100% dari pokok.',
  },
  {
    q: 'KTP kamu difoto oleh debt collector pinjol ilegal. Apa risikonya?',
    options: ['Tidak ada risiko', 'Data bisa dijual atau disalahgunakan', 'Otomatis terdaftar di BI Checking', 'Kamu akan ditangkap polisi'],
    correct: 1,
    explain: 'Data pribadi bisa dijual, digunakan untuk pinjaman atas nama kamu, atau untuk intimidasi.',
  },
  {
    q: 'Langkah pertama jika kamu menjadi korban penipuan investasi?',
    options: ['Diam saja karena malu', 'Kumpulkan bukti dan lapor ke OJK 157 + Polisi', 'Investasi lagi untuk menutupi kerugian', 'Hubungi penipu untuk minta uang kembali'],
    correct: 1,
    explain: 'Segera kumpulkan bukti dan lapor ke OJK 157 serta buat laporan polisi.',
  },
  {
    q: 'Dana darurat idealnya berapa kali pengeluaran bulanan?',
    options: ['1 bulan', '3–6 bulan', '12 bulan', 'Tidak perlu'],
    correct: 1,
    explain: 'Standar internasional: 3–6 bulan pengeluaran. Freelancer/pengusaha idealnya 6–12 bulan.',
  },
  {
    q: 'Mana yang BUKAN ciri pinjol ilegal?',
    options: ['Minta akses semua kontak HP', 'Bunga >0,4%/hari', 'Terdaftar di OJK', 'Tenor sangat pendek (7 hari)'],
    correct: 2,
    explain: 'Pinjol yang terdaftar di OJK sudah melewati verifikasi.',
  },
]

const TIPS = [
  { title: 'Tabungan vs investasi', content: 'Tabungan untuk dana darurat (aman, likuid). Investasi untuk jangka panjang (ada risiko). Jangan investasi uang yang kamu butuhkan dalam 1 tahun ke depan.' },
  { title: 'Cek pinjol legal', content: 'Buka ojk.go.id → IKNB → Fintech → Daftar Penyelenggara. Jika tidak ada di daftar = ILEGAL.' },
  { title: 'Rumus 50/30/20', content: '50% kebutuhan, 30% keinginan, 20% tabungan & investasi. Sesuaikan dengan kondisimu.' },
  { title: 'Lindungi data pribadi', content: 'Jangan share KTP, selfie dengan KTP, PIN ATM, OTP, atau nomor kartu kredit.' },
  { title: 'Jenis investasi', content: 'Deposito (aman, 3–5%). Reksadana (5–15%). Saham (risiko tinggi). Crypto (sangat volatile).' },
  { title: 'Hak konsumen', content: 'UU 21/2011 mewajibkan OJK melindungimu. Hubungi 157 jika hakmu dilanggar.' },
]

type Tab = 'quiz' | 'tips' | 'kalkulator' | 'lapor'

export default function Edukasi() {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [tab, setTab] = useState<Tab>('quiz')

  const q = QUIZ[currentQ]

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    if (idx === q.correct) setScore(s => s + 1)
    setAnswered(a => a + 1)
  }

  function nextQuestion() {
    setSelected(null)
    setCurrentQ(c => (c + 1) % QUIZ.length)
  }

  const pct = answered > 0 ? Math.round((score / answered) * 100) : 0

  const tabs: { id: Tab; label: string; hint: string }[] = [
    { id: 'quiz', label: 'Quiz', hint: 'Uji literasi keuanganmu' },
    { id: 'tips', label: 'Tips', hint: 'Panduan harian' },
    { id: 'kalkulator', label: 'Kalkulator', hint: 'Bunga jujur, anti predator' },
    { id: 'lapor', label: 'Lapor Penipuan', hint: 'Cek rekening/nomor + panduan lapor' },
  ]

  return (
    <PageShell
      eyebrow="Edukasi"
      title="Belajar perlahan, paham seumur hidup."
      subtitle="Quiz, tips, dan kalkulator pinjaman — semuanya dalam satu tempat untuk meningkatkan literasi keuanganmu."
    >
      {/* Sub-nav */}
      <div className="mb-8 -mx-2 px-2 overflow-x-auto">
        <div className="inline-flex bg-[var(--vn-bg-deep)] p-1 rounded-full gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-white text-[var(--vn-forest-dark)] shadow-sm' : 'text-[var(--vn-ink-soft)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[var(--vn-muted)]">
          {tabs.find(t => t.id === tab)?.hint}
        </p>
      </div>

      {tab === 'kalkulator' && <KalkulatorPanel />}
      {tab === 'lapor' && <LaporPenipuan embedded />}

      {tab === 'quiz' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <Bento padding="lg" className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <p className="vn-eyebrow mb-3">Pertanyaan {currentQ + 1} / {QUIZ.length}</p>
                <h3 className="vn-headline text-[20px] sm:text-[24px] mb-5">{q.q}</h3>

                <div className="space-y-2.5">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={selected !== null}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-[14.5px] transition-colors border ${
                        selected === null
                          ? 'bg-white border-[var(--vn-line)] hover:bg-[var(--vn-bg-deep)]'
                          : i === q.correct
                          ? 'bg-[var(--vn-cream)] border-[var(--vn-forest)]/30 text-[var(--vn-forest-dark)]'
                          : selected === i
                          ? 'bg-[var(--vn-red-soft)] border-[var(--vn-red)]/30 text-[var(--vn-red)]'
                          : 'bg-[var(--vn-bg-deep)] border-transparent opacity-60'
                      }`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>

                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                    <div
                      className={`p-4 rounded-2xl text-[14px] leading-relaxed ${
                        selected === q.correct
                          ? 'bg-[var(--vn-cream)] text-[var(--vn-forest-dark)]'
                          : 'bg-[var(--vn-red-soft)] text-[var(--vn-red)]'
                      }`}
                    >
                      <strong>{selected === q.correct ? '✓ Benar — ' : '✕ Salah — '}</strong>
                      {q.explain}
                    </div>
                    <button onClick={nextQuestion} className="mt-4 vn-btn vn-btn-primary">
                      Pertanyaan berikutnya
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </Bento>

          <Bento tone="forest" padding="lg" className="lg:col-span-2">
            <p className="vn-eyebrow !text-[var(--vn-mint)] mb-3">Skormu</p>
            <p className="vn-display text-[80px] text-white">{pct}%</p>
            <p className="text-white/80 text-[14px] mb-6">
              {score} benar dari {answered} pertanyaan
            </p>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden mb-6">
              <div
                className="h-full bg-white transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-white/75 text-[13.5px] leading-relaxed">
              Tujuan literasi keuangan bukan jadi ahli — tapi cukup waspada untuk tidak
              terjebak penipuan dan cukup paham untuk merencanakan.
            </p>
          </Bento>
        </div>
      )}

      {tab === 'tips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {TIPS.map((tip, i) => (
            <Bento key={i} delay={i * 0.04} tone={i % 3 === 0 ? 'cream' : i % 3 === 1 ? 'mint' : 'white'}>
              <p className="vn-eyebrow mb-2">Tip {i + 1}</p>
              <h3 className="vn-headline text-[18px] mb-2">{tip.title}</h3>
              <p className="text-[14px] text-[var(--vn-ink-soft)] leading-relaxed">{tip.content}</p>
            </Bento>
          ))}
        </div>
      )}
    </PageShell>
  )
}
