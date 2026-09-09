import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      {description && (
        <p className="mb-6 text-sm text-paper-muted">{description}</p>
      )}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-paper-muted transition-colors hover:bg-line hover:text-paper"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-paper transition-colors disabled:opacity-60 ${
            danger
              ? 'bg-red-600 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.6)] hover:bg-red-500'
              : 'bg-brand shadow-[0_8px_24px_-8px_rgba(228,55,28,0.6)] hover:bg-brand/90'
          }`}
        >
          {loading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
