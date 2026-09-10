import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { statusMapping, TicketStatusColor } from '../../lib/constants'

interface StatusDropdownProps {
  currentStatus: string | number
  onStatusChange: (status: string) => void
  disabled?: boolean
  canComplete?: boolean
  isInReview?: boolean
  onOpenCompleteModal?: () => void
  onOpenRejectModal?: () => void
  isAssigned?: boolean
  isAssigner?: boolean
}

export default function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
  canComplete = false,
  isInReview = false,
  onOpenCompleteModal,
  onOpenRejectModal,
  isAssigned = false,
  isAssigner = false,
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
  const displayLabel = statusMapping[statusKey] ?? statusKey

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
        <div className="absolute left-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-ink-soft shadow-xl shadow-ink/60">
          {Object.entries(statusMapping).map(([key, label]) => {
            const isActive = key.toLowerCase() === statusKey.toLowerCase()
            const isCompleted = key.toLowerCase() === 'completed'
            const isClosed = key.toLowerCase() === 'closed' || key.toLowerCase() === 'close'
            const isRejected = key.toLowerCase() === 'rejected' || key.toLowerCase() === 'reject'

            // Rule 1: Close option usee nahi dikhega jisko assign hui hai (assignee)
            if (isClosed && isAssigned && !isAssigner) {
              return null
            }

            // Rule 2: Reject option usee nahi dikhega jisne assign kari hai (assigner/creator)
            // Aur reject sirf assignee ko dikhega, aur tabhi tak dikhega jab tak status Open ho
            if (isRejected) {
              if (isAssigner || !isAssigned) {
                return null
              }
              const currentStatusStr = String(currentStatus).toLowerCase().trim()
              const isCurrentlyOpen =
                currentStatusStr === 'open' || currentStatusStr === '1' || currentStatus === 1
              if (!isCurrentlyOpen && !isActive) {
                return null
              }
            }

            // Only show Completed option if it is already Completed OR (ticket is InReview and user canComplete)
            if (isCompleted && !isActive && !canComplete) {
              return null
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (isRejected && onOpenRejectModal) {
                    onOpenRejectModal()
                  } else if (isCompleted && canComplete && onOpenCompleteModal) {
                    onOpenCompleteModal()
                  } else {
                    onStatusChange(key)
                  }
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-line font-semibold text-paper'
                    : 'text-paper-muted hover:bg-line hover:text-paper'
                }`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: TicketStatusColor[key] ?? '#f59e0b' }}
                />
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
