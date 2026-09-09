import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Check, X, User, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface SearchableOption {
  id: number | string
  label: string
  sublabel?: string
  badge?: string
  avatar?: string
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value: number | string | ''
  onChange: (value: number | string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  allowClear?: boolean
  maxDisplayCount?: number
  seeMorePath?: string
  seeMoreLabel?: string
  onSeeMore?: (searchTerm: string) => void
}

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  className = '',
  allowClear = true,
  maxDisplayCount,
  seeMorePath,
  seeMoreLabel = 'See all',
  onSeeMore,
}: SearchableSelectProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropUp, setDropUp] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check whether to open above or below based on viewport space
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setDropUp(spaceBelow < 280 && spaceAbove > 280)
    }
  }, [open])

  // Focus search input on open
  useEffect(() => {
    if (open) {
      setSearchTerm('')
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Click outside listener
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function toggle() {
    if (disabled) return
    setOpen((prev) => !prev)
  }

  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) return []
    if (!searchTerm.trim()) return options
    const q = searchTerm.toLowerCase().trim()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q)),
    )
  }, [options, searchTerm])

  const displayedOptions = useMemo(() => {
    if (maxDisplayCount && maxDisplayCount > 0) {
      return filteredOptions.slice(0, maxDisplayCount)
    }
    return filteredOptions
  }, [filteredOptions, maxDisplayCount])

  const hasMore = Boolean(maxDisplayCount && filteredOptions.length > maxDisplayCount)
  const remainingCount = maxDisplayCount ? Math.max(0, filteredOptions.length - maxDisplayCount) : 0

  const selectedOption = useMemo(
    () => (Array.isArray(options) ? options.find((opt) => String(opt.id) === String(value)) : undefined),
    [options, value],
  )

  function handleSelect(optId: number | string) {
    onChange(optId)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  function handleSeeMoreClick(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(false)
    if (onSeeMore) {
      onSeeMore(searchTerm)
    } else if (seeMorePath) {
      const query = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : ''
      navigate(`${seeMorePath}${query}`)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className} ${open ? 'z-50' : 'z-auto'}`}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`flex w-full items-center justify-between rounded-xl border border-line bg-ink px-3.5 py-2.5 text-left text-sm transition-all focus:outline-none ${
          disabled
            ? 'cursor-not-allowed opacity-50 bg-ink/40'
            : 'hover:border-paper/30 cursor-pointer'
        } ${open ? 'border-brand ring-1 ring-brand/30' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption ? (
            <>
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand">
                {selectedOption.label[0]?.toUpperCase() ?? <User className="size-3" />}
              </div>
              <span className="truncate font-medium text-paper">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="shrink-0 rounded-md bg-line px-1.5 py-0.5 text-[10px] font-medium text-paper-muted">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="truncate text-paper-muted/60">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {allowClear && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  onChange('')
                }
              }}
              className="rounded p-1 text-paper-muted hover:bg-line hover:text-paper cursor-pointer"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={`size-4 text-paper-muted transition-transform duration-200 ${
              open ? 'rotate-180 text-brand' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu — Pure CSS absolute positioning, 100% reliable & never detached */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute left-0 right-0 ${
              dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } z-50 overflow-hidden rounded-xl border border-line bg-ink-soft shadow-2xl shadow-black/90 flex flex-col backdrop-blur-2xl`}
            style={{ minWidth: '100%' }}
          >
            {/* Search Input */}
            <div className="border-b border-line p-2 shrink-0 bg-ink/60">
              <div className="flex items-center gap-2 rounded-lg bg-ink px-2.5 py-1.5 text-sm text-paper border border-line/40 focus-within:border-brand/50">
                <Search className="size-4 shrink-0 text-paper-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-paper outline-none placeholder:text-paper-muted/60"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-paper-muted hover:text-paper"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-60 divide-y divide-line/20">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-paper-muted">
                  {searchTerm ? `No results for "${searchTerm}"` : 'No options available'}
                </div>
              ) : (
                displayedOptions.map((opt) => {
                  const isSelected = String(opt.id) === String(value)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-brand/15 text-brand font-medium'
                          : 'text-paper hover:bg-line/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isSelected
                              ? 'bg-brand text-paper'
                              : 'bg-line text-paper-muted'
                          }`}
                        >
                          {opt.label[0]?.toUpperCase() ?? <User className="size-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium leading-tight">
                            {opt.label}
                          </p>
                          {opt.sublabel && (
                            <p className="truncate text-xs text-paper-muted">
                              {opt.sublabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {opt.badge && (
                          <span className="rounded-md bg-line px-1.5 py-0.5 text-[10px] font-medium text-paper-muted">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && <Check className="size-4 text-brand" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* See More Footer */}
            {(seeMorePath || onSeeMore) && (hasMore || searchTerm.trim()) && (
              <div className="border-t border-line bg-ink/60 p-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSeeMoreClick}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {seeMoreLabel}
                    {hasMore && (
                      <span className="rounded-md bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                        +{remainingCount} more
                      </span>
                    )}
                  </span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
