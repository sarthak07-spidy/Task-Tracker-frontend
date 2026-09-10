import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import Spinner from '../ui/Spinner'

interface TimeLoggerProps {
  currentHours: number | null
  onLog: (hours: number) => Promise<void>
}

export default function TimeLogger({ currentHours, onLog }: TimeLoggerProps) {
  const [hours, setHours] = useState(String(currentHours ?? ''))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setHours(currentHours != null ? String(currentHours) : '')
  }, [currentHours])

  async function submit() {
    const val = parseFloat(hours)
    if (isNaN(val) || val < 0) return
    setLoading(true)
    try {
      await onLog(val)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-ink/60 px-3 py-2">
        <Clock className="size-4 text-paper-muted" />
        <input
          type="number"
          min="0"
          step="any"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours"
          className="w-16 bg-transparent text-sm text-paper outline-none placeholder:text-paper-muted/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-xs text-paper-muted">hrs</span>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={loading || !hours}
        className="rounded-xl bg-cobalt/20 px-3 py-2 text-xs font-semibold text-cobalt transition-colors hover:bg-cobalt/30 disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" /> : 'Log'}
      </button>
    </div>
  )
}
