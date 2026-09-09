import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <span className="text-xs text-paper-muted">
        {total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </span>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex size-8 items-center justify-center rounded-xl border border-line bg-ink text-paper-muted transition-all hover:border-brand hover:text-paper disabled:pointer-events-none disabled:opacity-25"
          title="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Current Active Page with Total Count */}
        <div className="flex items-center gap-1.5 px-1">
          <div className="relative flex size-8 items-center justify-center overflow-hidden rounded-xl bg-brand text-xs font-bold text-paper shadow-md shadow-brand/25">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={page}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {page}
              </motion.span>
            </AnimatePresence>
          </div>
          {totalPages > 1 && (
            <span className="text-xs font-medium text-paper-muted">
              of {totalPages}
            </span>
          )}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex size-8 items-center justify-center rounded-xl border border-line bg-ink text-paper-muted transition-all hover:border-brand hover:text-paper disabled:pointer-events-none disabled:opacity-25"
          title="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {onPageSizeChange && (
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-paper outline-none focus:border-brand"
        >
          {[6, 10, 20, 50].map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
