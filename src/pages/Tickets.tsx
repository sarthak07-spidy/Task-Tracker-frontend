import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Ticket as TicketIcon,
  AlertCircle,
  FolderKanban,
  Search,
  ArrowRight,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react'
import api from '../lib/api'
import type { ApiResponse, Ticket, TicketFilters as FiltersType, Project } from '../lib/types'
import { DEFAULT_PAGE_SIZE, TicketStatusLabel, PriorityLabel, CategoryLabel } from '../lib/constants'
import TicketCard from '../components/tickets/TicketCard'
import TicketFilters from '../components/tickets/TicketFilters'
import ApprovalPanel from '../components/tickets/ApprovalPanel'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import SearchableSelect from '../components/ui/SearchableSelect'

const ease = [0.22, 1, 0.36, 1] as const

export default function Tickets() {
  const [searchParams, setSearchParams] = useSearchParams()

  const queryProjectId = searchParams.get('projectId')
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(
    queryProjectId ? Number(queryProjectId) : '',
  )

  const [projects, setProjects] = useState<Project[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [filters, setFilters] = useState<FiltersType>({
    pageNumber: 1,
    pageSize: 10,
  })

  // Keep selectedProjectId in sync with searchParams
  useEffect(() => {
    if (queryProjectId) {
      setSelectedProjectId(Number(queryProjectId))
    }
  }, [queryProjectId])

  // ─── Fetch All Projects for Dropdown ────────────────────────────────────────
  useEffect(() => {
    api
      .get<ApiResponse<{ projects?: Project[] } | Project[]>>('/projects/all', {
        params: { pageSize: 100 },
      })
      .then(({ data }) => {
        const d = (data?.success && data?.data) ? data.data : data
        if (Array.isArray(d)) {
          setProjects(d)
        } else if (d && 'projects' in d && Array.isArray(d.projects)) {
          setProjects(d.projects)
        }
      })
      .catch(() => {})
  }, [])

  // ─── Fetch Tickets for Selected Project ─────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    if (!selectedProjectId) {
      setTickets([])
      setTotalCount(0)
      return
    }

    setLoading(true)
    setError('')

    try {
      const params: Record<string, string | number> = {
        projectId: selectedProjectId,
        pageNumber: filters.pageNumber ?? 1,
        pageSize: filters.pageSize ?? 10,
      }
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      if (filters.category) params.category = filters.category
      if (filters.sprintPhase) params.sprintPhase = filters.sprintPhase
      if (filters.assignedToUserId)
        params.assignedToUserId = filters.assignedToUserId

      const { data } = await api.get('/tickets', { params })
      const result = (data?.success && data?.data) ? data.data : data

      if (Array.isArray(result)) {
        setTickets(result)
        setTotalCount(result.length)
      } else if (result?.tickets && Array.isArray(result.tickets)) {
        setTickets(result.tickets)
        setTotalCount(result.totalCount ?? result.tickets.length)
      } else {
        setTickets([])
        setTotalCount(0)
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? ''
      // If error is the backend SQL column issue, show friendly guidance
      if (msg.includes('ApprovalRemark') || msg.includes('column name')) {
        setError(
          'Tickets for this project are being synchronized on the server. You can create a new ticket using the button above.',
        )
      } else {
        setError(msg || 'No tickets found or unable to fetch tickets.')
      }
      setTickets([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId, filters])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  function handleSelectProject(projId: number | string) {
    const numericId = projId ? Number(projId) : ''
    setSelectedProjectId(numericId)
    setFilters((f) => ({ ...f, pageNumber: 1 }))
    if (numericId) {
      setSearchParams({ projectId: String(numericId) })
    } else {
      setSearchParams({})
    }
  }

  const currentProject = useMemo(
    () => projects.find((p) => p.id === Number(selectedProjectId)),
    [projects, selectedProjectId],
  )

  // Local search & criteria filter
  const displayedTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 1. Local Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesSearch =
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.userStoryId?.toLowerCase().includes(q) ||
          t.tags?.toLowerCase().includes(q) ||
          t.createdByName?.toLowerCase().includes(q) ||
          t.assignedToName?.toLowerCase().includes(q) ||
          String(t.id).includes(q)
        if (!matchesSearch) return false
      }

      // 2. Status filter
      if (filters.status) {
        const label = TicketStatusLabel[t.status] || String(t.status)
        if (label.toLowerCase() !== filters.status.toLowerCase()) {
          return false
        }
      }

      // 3. Priority filter
      if (filters.priority) {
        const label = PriorityLabel[t.priority] || String(t.priority)
        if (label.toLowerCase() !== filters.priority.toLowerCase()) {
          return false
        }
      }

      // 4. Category filter
      if (filters.category) {
        const label = CategoryLabel[t.category] || String(t.category)
        if (label.toLowerCase() !== filters.category.toLowerCase()) {
          return false
        }
      }

      // 5. Sprint filter
      if (filters.sprintPhase && filters.sprintPhase.trim()) {
        const sprint = (t.sprintPhase || '').toLowerCase()
        if (!sprint.includes(filters.sprintPhase.toLowerCase().trim())) {
          return false
        }
      }

      return true
    })
  }, [tickets, searchQuery, filters])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-paper">
            Tickets Management
          </h1>
          <p className="mt-1 text-sm text-paper-muted">
            {selectedProjectId && currentProject
              ? `Viewing tickets for ${currentProject.name}`
              : 'Select a project to view and manage its tickets'}
          </p>
        </div>

        {selectedProjectId && (
          <Link
            to={`/app/tickets/new?projectId=${selectedProjectId}`}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/35 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" />
            New Ticket
          </Link>
        )}
      </motion.div>

      {/* ─── Project Selector Bar ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-ink-soft p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cobalt/15 text-cobalt">
              <FolderKanban className="size-5" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-paper-muted">
                Active Project
              </label>
              <p className="text-sm font-semibold text-paper">
                {currentProject ? currentProject.name : 'No project selected'}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <SearchableSelect
              options={projects.map((p) => ({
                id: p.id,
                label: p.name,
                sublabel: p.companyName ?? undefined,
                badge: p.status ?? undefined,
              }))}
              value={selectedProjectId}
              onChange={handleSelectProject}
              placeholder="Search & Select Project..."
              searchPlaceholder="Type project name to search..."
              maxDisplayCount={5}
              seeMorePath="/app/projects"
              seeMoreLabel="See all projects in Projects"
            />
          </div>
        </div>
      </div>

      {/* ─── STATE 1: No Project Selected ────────────────────────────────────── */}
      {!selectedProjectId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-ink-soft/60 px-6 py-20 text-center"
        >
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand/15 text-brand shadow-lg shadow-brand/10">
            <FolderKanban className="size-8" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-paper">
            Please Select a Project
          </h2>
          <p className="mt-2 max-w-md text-sm text-paper-muted leading-relaxed">
            Tickets are grouped by project. Search and select a project from the dropdown above to view its tickets, track progress, and manage tasks.
          </p>
        </motion.div>
      )}

      {/* ─── STATE 2: Project Selected ───────────────────────────────────────── */}
      {selectedProjectId && (
        <>
          {error && (
            <div
              className="flex items-center gap-3 rounded-2xl p-4 shadow-sm border"
              style={{
                backgroundColor: 'var(--sync-banner-bg, #fffbeb)',
                borderColor: 'var(--sync-banner-border, #fcd34d)',
              }}
            >
              <Info
                className="size-5 shrink-0"
                style={{ color: 'var(--sync-banner-icon, #b45309)' }}
              />
              <div
                className="text-xs font-semibold leading-relaxed"
                style={{ color: 'var(--sync-banner-text, #78350f)' }}
              >
                {error}
              </div>
            </div>
          )}

          {/* Approval panel for managers */}
          <ApprovalPanel />

          {/* Search & Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-ink-soft p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-paper-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tickets by title or description..."
                  className="w-full rounded-xl border border-line bg-ink pl-10 pr-4 py-2.5 text-sm text-paper placeholder:text-paper-muted/50 focus:border-brand focus:outline-none"
                />
              </div>

              {/* Reset search */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-xl border border-line px-3 py-2 text-xs text-paper-muted hover:text-paper"
                >
                  Clear Search
                </button>
              )}
            </div>

            <TicketFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Ticket Grid */}
          {loading ? (
            <PageLoader />
          ) : displayedTickets.length === 0 ? (
            <EmptyState
              icon={TicketIcon}
              title="No tickets found for this project"
              description="Try changing the filters, or create the first ticket for this project."
              action={
                <Link
                  to={`/app/tickets/new?projectId=${selectedProjectId}`}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/35"
                >
                  <Plus className="size-4" />
                  Create Ticket
                </Link>
              }
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {displayedTickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease }}
                >
                  <TicketCard ticket={ticket} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <Pagination
              page={filters.pageNumber ?? 1}
              pageSize={filters.pageSize ?? 10}
              total={totalCount}
              onPageChange={(p) => setFilters((f) => ({ ...f, pageNumber: p }))}
              onPageSizeChange={(s) =>
                setFilters((f) => ({ ...f, pageSize: s, pageNumber: 1 }))
              }
            />
          )}
        </>
      )}
    </div>
  )
}
