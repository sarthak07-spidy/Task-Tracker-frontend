import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
  hideScrollbar?: boolean
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  hideScrollbar = false,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* overlay */}
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

          {/* panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative flex max-h-[90vh] w-full flex-col ${maxWidth} rounded-2xl border border-line bg-ink-soft shadow-2xl shadow-ink/60`}
          >
            {/* Header — always visible */}
            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
                <h2 className="font-display text-lg font-bold text-paper">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-paper-muted transition-colors hover:bg-line hover:text-paper"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {!title && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-paper-muted transition-colors hover:bg-line hover:text-paper"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Scrollable body */}
            <div className={`overflow-y-auto px-6 py-5 ${hideScrollbar ? 'no-scrollbar' : ''}`}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
