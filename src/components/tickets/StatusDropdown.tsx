import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { statusMapping, TicketStatusColor } from '../../lib/constants'

interface StatusDropdownProps {
  currentStatus: string | number
  onStatusChange: (status: string) => void
  disabled?: boolean
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
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onStatusChange(key)
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
