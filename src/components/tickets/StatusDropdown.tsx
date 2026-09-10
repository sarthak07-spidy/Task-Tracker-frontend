import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { statusMapping, TicketStatusColor } from '../../lib/constants'

interface StatusDropdownProps {
  currentStatus: string | number
  onStatusChange: (status: string) => void
  disabled?: boolean
  isInReview?: boolean
  onOpenRejectModal?: () => void
  isAssigned?: boolean
  isAssigner?: boolean
  // canReject: passed from parent — true only if ticket was NEVER status-changed before (history is empty)
  canReject?: boolean
}

export default function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
  isInReview = false,
  onOpenRejectModal,
  isAssigned = false,
  isAssigner = false,
  canReject = false,
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const statusKey = String(currentStatus ?? 'Open')
  const isClosedStatus =
    statusKey.toLowerCase() === 'closed' ||
    statusKey.toLowerCase() === 'close' ||
    statusKey === '5'
  const displayLabel = isClosedStatus ? 'Completed' : (statusMapping[statusKey] ?? statusKey)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium transition-colors hover:border-paper/30 disabled:opacity-50"
        style={{ color: TicketStatusColor[statusKey] ?? '#f59e0b' }}
      >
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: TicketStatusColor[statusKey] ?? '#f59e0b' }}
        />
        {displayLabel}
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-ink-soft shadow-xl shadow-ink/60">
          {Object.entries(statusMapping).map(([key, label]) => {
            const isActive = key.toLowerCase() === statusKey.toLowerCase()
            const isCompleted = key.toLowerCase() === 'completed'
            const isClosed = key.toLowerCase() === 'closed' || key.toLowerCase() === 'close'
            const isRejected = key.toLowerCase() === 'rejected' || key.toLowerCase() === 'reject'

            // Hide raw Closed option — 'Completed' key is shown instead
            if (isClosed) return null

            // Rejected: hide only from assigner/creator (assigner cannot reject own ticket)
            if (isRejected && isAssigner) return null

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (isRejected && onOpenRejectModal) {
                    onOpenRejectModal()
                  } else {
                    onStatusChange(key)
                  }
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-line font-semibold text-paper'
                    : 'text-paper-muted hover:bg-line hover:text-paper'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: TicketStatusColor[key] ?? '#f59e0b' }}
                  />
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
