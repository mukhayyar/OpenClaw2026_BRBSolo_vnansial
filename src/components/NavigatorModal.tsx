import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'

type Item = {
  to: string
  title: string
  desc: string
  eyebrow: string
  tone?: 'forest' | 'mint' | 'cream' | 'white' | 'ink' | 'deep'
  big?: boolean
}

const ITEMS: Item[] = [
  { to: '/kesehatan', title: 'Cek Kesehatan Finansial', desc: 'Skor 0–100 dari 4 pilar', eyebrow: 'Diagnosa', tone: 'forest', big: true },
  { to: '/asisten', title: 'Asisten AI', desc: 'Chat lengkap dengan tool-calling', eyebrow: 'AI', tone: 'ink' },
  { to: '/portofolio', title: 'Portofolio', desc: 'Saham, crypto, reksadana, buffer', eyebrow: 'Aset' },
  { to: '/emiten', title: 'Cek Emiten IDX', desc: 'Profil, dividen, ESG, pemegang saham', eyebrow: 'Saham', tone: 'cream' },
  { to: '/crypto', title: 'CryptoWatch', desc: 'Harga + skor risiko scam', eyebrow: 'Crypto' },
  { to: '/asuransi', title: 'Asuransi', desc: 'Bandingkan & hitung premi', eyebrow: 'Proteksi', tone: 'mint' },
  { to: '/edukasi', title: 'Edukasi + Kalkulator', desc: 'Quiz, tips, kalkulator bunga jujur', eyebrow: 'Belajar' },
  { to: '/cek-investasi', title: 'Cek Investasi', desc: 'Verifikasi izin OJK & red flag', eyebrow: 'Verifikasi', tone: 'cream' },
  { to: '/rencana-investasi', title: 'Rencana Investasi', desc: 'Target & alokasi aset', eyebrow: 'Rencana' },
  { to: '/lapor', title: 'Lapor Penipuan', desc: 'Cek rekening, nomor HP, panduan lapor', eyebrow: 'Bantuan', tone: 'ink' },
  { to: '/settings', title: 'Pengaturan', desc: 'Telegram, agent kustom, sesi & PIN', eyebrow: 'Setup', tone: 'deep' },
]

type Props = { open: boolean; onClose: () => void }

export default function NavigatorModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--vn-ink)]/40 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-0 z-[91] flex items-start justify-center px-4 py-12 overflow-y-auto"
          >
            <div className="bento bento-pad-lg bg-white w-full max-w-4xl my-auto" style={{ boxShadow: 'var(--vn-shadow-lg)' }}>
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <p className="vn-eyebrow mb-2">Navigasi cepat</p>
                  <h2 className="vn-display text-[32px] sm:text-[40px] leading-[1.05]">
                    Mau ke mana <span className="vn-text-gradient">hari ini?</span>
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Tutup"
                  className="w-10 h-10 rounded-full bg-[var(--vn-bg-deep)] grid place-items-center text-[var(--vn-ink)]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {ITEMS.map((item, i) => {
                  const isInk = item.tone === 'forest' || item.tone === 'ink'
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={item.big ? 'col-span-2 row-span-1' : ''}
                    >
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={`block bento bento-pad h-full ${
                          item.tone === 'forest' ? 'bento-forest' :
                          item.tone === 'mint' ? 'bento-mint' :
                          item.tone === 'cream' ? 'bento-cream' :
                          item.tone === 'ink' ? 'bento-ink' :
                          item.tone === 'deep' ? 'bento-deep' : ''
                        }`}
                      >
                        <p className={`vn-eyebrow mb-2 ${isInk ? '!text-[var(--vn-mint)]' : ''}`}>
                          {item.eyebrow}
                        </p>
                        <p className={`vn-headline text-[17px] mb-1 ${isInk ? 'text-white' : ''}`}>
                          {item.title}
                        </p>
                        <p className={`text-[12.5px] ${isInk ? 'text-white/75' : 'text-[var(--vn-ink-soft)]'}`}>
                          {item.desc}
                        </p>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              <p className="mt-6 text-[12px] text-[var(--vn-muted)] text-center">
                Tip: klik logo Vnansial kapan saja untuk membuka menu ini.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
