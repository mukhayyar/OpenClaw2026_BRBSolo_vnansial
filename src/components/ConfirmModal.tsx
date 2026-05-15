import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah kamu yakin?',
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  variant = 'default',
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-[var(--vn-ink)]/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative z-[101] bg-white rounded-3xl p-6 w-full max-w-sm"
            style={{ boxShadow: 'var(--vn-shadow-xl)' }}
          >
            <div className="flex items-start gap-3 mb-4">
              {variant === 'danger' && (
                <div className="w-10 h-10 rounded-full bg-[var(--vn-red-soft)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--vn-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-[15px] font-semibold text-[var(--vn-ink)]">{title}</p>
                <p className="text-[13px] text-[var(--vn-ink-soft)] mt-1">{message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="vn-btn vn-btn-ghost !py-2 !px-5 text-[13px]"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => { onConfirm(); onClose() }}
                className={
                  variant === 'danger'
                    ? 'px-5 py-2 rounded-full text-[13px] font-medium bg-[var(--vn-red)] text-white hover:opacity-90 transition-opacity'
                    : 'vn-btn vn-btn-primary !py-2 !px-5 text-[13px]'
                }
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
