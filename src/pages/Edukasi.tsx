import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizQ {
  q: string
  options: string[]
  correct: number
  explain: string
}

const QUIZ: QuizQ[] = [
  {
    q: 'Seseorang menawarkan investasi dengan return 10% per bulan PASTI. Apa yang harus kamu lakukan?',
    options: ['Segera investasi sebelum kehabisan', 'Cek di OJK dan tolak jika tidak terdaftar', 'Ajak teman ikut juga', 'Pinjam uang untuk investasi'],
    correct: 1,
    explain: 'Return >2%/bulan yang dijamin adalah tanda investasi bodong. Selalu cek di sikapiuangmu.ojk.go.id sebelum investasi.',
  },
  {
    q: 'Pinjaman online (pinjol) yang legal harus terdaftar di mana?',
    options: ['Kemenkominfo', 'OJK (Otoritas Jasa Keuangan)', 'Google Play Store', 'Bank Indonesia'],
    correct: 1,
    explain: 'Pinjol legal harus terdaftar dan diawasi OJK. Cek di ojk.go.id/id/kanal/iknb/financial-technology.',
  },
  {
    q: 'Apa itu "skema Ponzi"?',
    options: ['Sistem investasi legal dari Italia', 'Uang investor baru dipakai bayar investor lama', 'Saham yang harganya naik terus', 'Tabungan berjangka di bank'],
    correct: 1,
    explain: 'Skema Ponzi menggunakan uang investor baru untuk membayar return investor lama. Saat tidak ada investor baru, sistem runtuh.',
  },
  {
    q: 'Berapa batas maksimal bunga pinjol per hari menurut OJK?',
    options: ['0.1%/hari', '0.4%/hari', '1%/hari', 'Tidak ada batasan'],
    correct: 1,
    explain: 'OJK membatasi bunga pinjol maksimal 0.4%/hari dengan total bunga tidak boleh melebihi 100% dari pokok pinjaman.',
  },
  {
    q: 'KTP kamu difoto oleh debt collector pinjol ilegal. Apa risikonya?',
    options: ['Tidak ada risiko', 'Data bisa dijual atau disalahgunakan', 'Otomatis terdaftar di BI Checking', 'Kamu akan ditangkap polisi'],
    correct: 1,
    explain: 'Data pribadi bisa dijual ke pihak lain, digunakan untuk pinjaman atas nama kamu, atau untuk intimidasi/pemerasan.',
  },
  {
    q: 'Apa langkah pertama jika kamu menjadi korban penipuan investasi?',
    options: ['Diam saja karena malu', 'Kumpulkan bukti dan lapor ke OJK (157) + Polisi', 'Investasi lagi untuk menutupi kerugian', 'Hubungi penipu untuk minta uang kembali'],
    correct: 1,
    explain: 'Segera kumpulkan semua bukti (screenshot, rekening, chat) dan lapor ke OJK di 157 serta buat laporan polisi.',
  },
  {
    q: 'Dana darurat idealnya berapa kali pengeluaran bulanan?',
    options: ['1 bulan', '3-6 bulan', '12 bulan', 'Tidak perlu dana darurat'],
    correct: 1,
    explain: 'Ahli keuangan merekomendasikan dana darurat 3-6 bulan pengeluaran. Untuk freelancer/pengusaha, idealnya 6-12 bulan.',
  },
  {
    q: 'Mana yang BUKAN ciri-ciri pinjol ilegal?',
    options: ['Minta akses semua kontak HP', 'Bunga >0.4%/hari', 'Terdaftar di OJK', 'Tenor sangat pendek (7 hari)'],
    correct: 2,
    explain: 'Pinjol yang terdaftar di OJK sudah melewati verifikasi. Pinjol ilegal biasanya minta akses berlebihan, bunga tinggi, dan tenor sangat pendek.',
  },
]

const TIPS = [
  { icon: '🏦', title: 'Tabungan vs Investasi', content: 'Tabungan untuk dana darurat (aman, likuid). Investasi untuk jangka panjang (ada risiko, potensi return lebih tinggi). Jangan investasi uang yang kamu butuhkan dalam 1 tahun ke depan.' },
  { icon: '📱', title: 'Cek Pinjol Legal', content: 'Buka ojk.go.id → IKNB → Fintech → Daftar Penyelenggara. Jika tidak ada di daftar = ILEGAL. Jangan pernah install pinjol yang minta akses kontak, galeri, atau SMS.' },
  { icon: '💰', title: 'Rumus 50/30/20', content: '50% penghasilan untuk kebutuhan (makan, transport, listrik). 30% untuk keinginan (hiburan, jajan). 20% untuk tabungan/investasi. Sesuaikan dengan kondisimu.' },
  { icon: '🔐', title: 'Lindungi Data Pribadi', content: 'Jangan pernah share: foto KTP, selfie dengan KTP, PIN ATM, OTP, nomor kartu kredit. Penipu sering menyamar sebagai bank/OJK untuk minta data ini.' },
  { icon: '📊', title: 'Kenali Jenis Investasi', content: 'Deposito (aman, 3-5%/thn). Reksadana (menengah, 5-15%/thn). Saham (tinggi, bisa untung/rugi besar). Crypto (sangat tinggi, sangat volatile). Makin tinggi return, makin tinggi risiko.' },
  { icon: '⚖️', title: 'Hak Kamu sebagai Konsumen', content: 'UU No. 21/2011: OJK wajib melindungi konsumen. Kamu berhak: informasi transparan, perlakuan adil, ganti rugi jika dirugikan. Lapor ke 157 jika hak dilanggar.' },
]

export default function Edukasi() {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [showTips, setShowTips] = useState(false)

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">📚 Edukasi Keuangan</h1>
        <p className="text-slate-400 mb-8">
          Belajar melindungi keuanganmu dengan cara yang mudah dan seru.
        </p>

        {/* Tab */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setShowTips(false)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              !showTips ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            🎮 Quiz
          </button>
          <button
            onClick={() => setShowTips(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              showTips ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            💡 Tips Keuangan
          </button>
        </div>

        {!showTips ? (
          <>
            {/* Score */}
            {answered > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Skor: <strong className="text-white">{score}/{answered}</strong> ({pct}%)
                </span>
                <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quiz */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="text-xs text-slate-500 mb-3">Pertanyaan {currentQ + 1} / {QUIZ.length}</div>
                <h3 className="text-lg font-bold mb-5">{q.q}</h3>

                <div className="space-y-3">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={selected !== null}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                        selected === null
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          : i === q.correct
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          : selected === i
                          ? 'bg-red-500/20 border-red-500/30 text-red-400'
                          : 'bg-white/5 border-white/10 opacity-50'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                    </button>
                  ))}
                </div>

                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <div className={`p-4 rounded-xl text-sm ${
                      selected === q.correct
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/10 border border-red-500/20 text-red-300'
                    }`}>
                      <strong>{selected === q.correct ? '✅ Benar!' : '❌ Salah.'}</strong>{' '}
                      {q.explain}
                    </div>
                    <button
                      onClick={nextQuestion}
                      className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm"
                    >
                      Pertanyaan Berikutnya →
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIPS.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="text-2xl mb-3">{tip.icon}</div>
                <h3 className="font-bold mb-2">{tip.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{tip.content}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
