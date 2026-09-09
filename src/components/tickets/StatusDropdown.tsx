import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { TicketStatusLabel, TicketStatusColor } from '../../lib/constants'

interface StatusDropdownProps {
  currentStatus: number
  onStatusChange: (status: string) => void
  disabled?: boolean
}

const statusKeys: Record<number, string> = {
  1: 'Open',
  2: 'InProgress',
  3: 'InReview',
  4: 'Completed',
  5: 'Closed',
  6: 'Rejected',
  7: 'OnHold',
}

export default function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium transition-colors hover:border-paper/30 disabled:opacity-50"
        style={{ color: TicketStatusColor[currentStatus] }}
      >
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: TicketStatusColor[currentStatus] }}
        />
        {TicketStatusLabel[currentStatus] ?? 'Unknown'}
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-ink-soft shadow-xl shadow-ink/60">
          {Object.entries(TicketStatusLabel).map(([key, label]) => {
            const k = Number(key)
            const isActive = k === currentStatus
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onStatusChange(statusKeys[k])
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-line font-semibold text-paper'
                    : 'text-paper-muted hover:bg-line hover:text-paper'
                }`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: TicketStatusColor[k] }}
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
