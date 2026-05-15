import { motion, AnimatePresence } from 'framer-motion'

type Props = { open: boolean; onClose: () => void }

export default function WalletModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[min(400px,92vw)] glass-strong rounded-2xl p-6 glass-neon-violet"
          >
            <div className="badge-onchain mb-4">Web3 Identity</div>
            <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
            <p className="text-slate-400 text-sm mb-4">
              Fitur identitas on-chain untuk profil agen dan riwayat tantangan akan hadir setelah hackathon.
              Saat ini gunakan <strong className="text-violet-300">Asisten AI</strong> tanpa wallet.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 mb-6">
              <li>· Agent session = identitas lokal browser</li>
              <li>· Tidak ada transaksi crypto nyata</li>
              <li>· Edukasi keuangan, bukan DeFi trading</li>
            </ul>
            <button type="button" onClick={onClose} className="w-full btn-neon py-3 rounded-xl">
              Mengerti
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
