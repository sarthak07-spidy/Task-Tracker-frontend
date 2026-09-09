import { Filter, X } from 'lucide-react'
import { statusMapping, PriorityLabel, CategoryLabel } from '../../lib/constants'
import type { TicketFilters as FiltersType } from '../../lib/types'

interface TicketFiltersProps {
  filters: FiltersType
  onChange: (f: FiltersType) => void
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Record<string | number, string>
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-xl border border-line bg-ink px-3 py-2 text-xs text-paper outline-none transition-colors focus:border-brand"
    >
      <option value="">{label}</option>
      {Object.entries(options).map(([key, val]) => (
        <option key={key} value={val}>
          {val}
        </option>
      ))}
    </select>
  )
}

export default function TicketFilters({ filters, onChange }: TicketFiltersProps) {
  const statusOpts: Record<string, string> = {}
  Object.values(statusMapping).forEach((v) => (statusOpts[v] = v))

  const priorityOpts: Record<string, string> = {}
  Object.values(PriorityLabel).forEach((v) => (priorityOpts[v] = v))

  const categoryOpts: Record<string, string> = {}
  Object.values(CategoryLabel).forEach((v) => (categoryOpts[v] = v))

  const hasActive =
    filters.status || filters.priority || filters.category || filters.sprintPhase

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="size-4 text-paper-muted" />
      <SelectField
        label="Status"
        value={filters.status ?? ''}
        options={statusOpts}
        onChange={(v) => onChange({ ...filters, status: v || undefined, pageNumber: 1 })}
      />
      <SelectField
        label="Priority"
        value={filters.priority ?? ''}
        options={priorityOpts}
        onChange={(v) => onChange({ ...filters, priority: v || undefined, pageNumber: 1 })}
      />
      <SelectField
        label="Category"
        value={filters.category ?? ''}
        options={categoryOpts}
        onChange={(v) => onChange({ ...filters, category: v || undefined, pageNumber: 1 })}
      />
      <input
        type="text"
        placeholder="Sprint…"
        value={filters.sprintPhase ?? ''}
        onChange={(e) =>
          onChange({ ...filters, sprintPhase: e.target.value || undefined, pageNumber: 1 })
        }
        className="w-24 rounded-xl border border-line bg-ink px-3 py-2 text-xs text-paper outline-none transition-colors placeholder:text-paper-muted/60 focus:border-brand"
      />
      {hasActive && (
        <button
          type="button"
          onClick={() =>
            onChange({
              pageNumber: 1,
              pageSize: filters.pageSize,
            })
          }
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
        >
          <X className="size-3" />
          Clear
        </button>
      )}
    </div>
  )
}
