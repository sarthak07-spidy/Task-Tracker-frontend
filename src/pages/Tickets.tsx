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
  XCircle,
  User,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { ApiResponse, Ticket, TicketFilters as FiltersType, Project } from '../lib/types'
import {
  DEFAULT_PAGE_SIZE,
  TicketStatusLabel,
  PriorityLabel,
  CategoryLabel,
  isTicketCompleted,
  isTicketRejected,
} from '../lib/constants'
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
  const { user } = useAuth()

  const queryProjectId = searchParams.get('projectId')
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(() => {
    if (queryProjectId) return Number(queryProjectId)
    const saved = localStorage.getItem('t_tracker_selected_project_id')
    return saved ? Number(saved) : ''
  })

  const [projects, setProjects] = useState<Project[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketScope, setTicketScope] = useState<
    'active' | 'assigned_to_me' | 'raised_by_me' | 'completed' | 'rejected'
  >('active')
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [filters, setFilters] = useState<FiltersType>({
    pageNumber: 1,
    pageSize: 10,
  })

  // Keep selectedProjectId in sync with searchParams and storage
  useEffect(() => {
    if (queryProjectId) {
      const num = Number(queryProjectId)
      setSelectedProjectId(num)
      localStorage.setItem('t_tracker_selected_project_id', String(num))
    } else {
      const saved = localStorage.getItem('t_tracker_selected_project_id')
      if (saved) {
        setSelectedProjectId(Number(saved))
        setSearchParams({ projectId: saved }, { replace: true })
      }
    }
  }, [queryProjectId, setSearchParams])

  // ─── Fetch All Projects for Dropdown ────────────────────────────────────────
  useEffect(() => {
    async function loadProjects() {
      try {
        let res
        try {
          res = await api.get('/Projects/all', { params: { pageSize: 100 } })
        } catch {
          res = await api.get('/projects/all', { params: { pageSize: 100 } })
        }
        const data = res?.data
        const d = (data?.success && data?.data) ? data.data : data
        const pList = Array.isArray(d) ? d : d?.projects || d?.data || []
        if (Array.isArray(pList)) {
          setProjects(pList)
        }
      } catch (err) {
        console.error('Failed to load projects in Tickets', err)
      }
    }
    loadProjects()
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
        pageSize: filters.pageSize ?? 50,
      }
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      if (filters.category) params.category = filters.category
      if (filters.sprintPhase) params.sprintPhase = filters.sprintPhase
      if (filters.assignedToUserId)
        params.assignedToUserId = filters.assignedToUserId

      // Concurrently query:
      // 1. Active: GET /api/tickets
      // 2. Completed: GET /api/tickets/completed
      // 3. Rejected: GET /api/tickets/rejected
      const [mainRes, completedRes, rejectedRes] = await Promise.allSettled([
        api.get('/tickets', { params }),
        api.get('/tickets/completed', {
          params: {
            projectId: selectedProjectId,
            ...(filters.priority ? { Priority: filters.priority } : {}),
            ...(filters.category ? { Category: filters.category } : {}),
            ...(filters.assignedToUserId ? { AssignedToUserId: filters.assignedToUserId } : {}),
          },
        }),
        api.get('/tickets/rejected', {
          params: {
            projectId: selectedProjectId,
          },
        }),
      ])

      const extractList = (res: PromiseSettledResult<{ data: unknown }>): Ticket[] => {
        if (res.status !== 'fulfilled' || !res.value?.data) return []
        const d = res.value.data as { success?: boolean; data?: unknown; tickets?: Ticket[] }
        const result = (d?.success && d?.data) ? d.data : d
        if (Array.isArray(result)) return result as Ticket[]
        if (
          result &&
          typeof result === 'object' &&
          'tickets' in result &&
          Array.isArray((result as { tickets?: unknown }).tickets)
        ) {
          return (result as { tickets: Ticket[] }).tickets
        }
        return []
      }

      const rawList = extractList(mainRes)
      const completedList = extractList(completedRes)
      const rejectedList = extractList(rejectedRes)

      // Deduplicate and merge tickets
      const ticketMap = new Map<number, Ticket>()

      rawList.forEach((t) => {
        if (t && t.id) ticketMap.set(t.id, t)
      })

      completedList.forEach((t) => {
        if (t && t.id) {
          const prev = ticketMap.get(t.id)
          ticketMap.set(t.id, {
            ...prev,
            ...t,
            status: t.status || (prev?.status ?? 'Closed'),
          })
        }
      })

      rejectedList.forEach((t) => {
        if (t && t.id) {
          const prev = ticketMap.get(t.id)
          ticketMap.set(t.id, {
            ...prev,
            ...t,
            status: t.status || (prev?.status ?? 'Rejected'),
          })
        }
      })

      const allMerged = Array.from(ticketMap.values())

      // Strictly ensure tickets belong to the selected project if ticket has projectId
      const projectFiltered = selectedProjectId
        ? allMerged.filter((t) => !t.projectId || Number(t.projectId) === Number(selectedProjectId))
        : allMerged

      setTickets(projectFiltered)
      setTotalCount(projectFiltered.length)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? ''
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
      localStorage.setItem('t_tracker_selected_project_id', String(numericId))
      setSearchParams({ projectId: String(numericId) })
    } else {
      localStorage.removeItem('t_tracker_selected_project_id')
      setSearchParams({})
    }
  }

  const currentProject = useMemo(
    () => projects.find((p) => p.id === Number(selectedProjectId)),
    [projects, selectedProjectId],
  )

  const isClosedTicket = (t: Ticket) => {
    const s = String(t.status ?? '').toLowerCase().trim()
    return s === 'closed' || s === 'close' || s === '5' || t.status === 5
  }

  const activeCount = useMemo(() => {
    return tickets.filter((t) => !isClosedTicket(t) && !isTicketRejected(t)).length
  }, [tickets])

  const assignedToMeCount = useMemo(() => {
    if (!user) return 0
    return tickets.filter((t) => t.assignedToUserId === user.userId).length
  }, [tickets, user])

  const raisedByMeCount = useMemo(() => {
    if (!user) return 0
    return tickets.filter((t) => t.createdByUserId === user.userId || t.assignedByUserId === user.userId).length
  }, [tickets, user])

  const completedCount = useMemo(() => {
    return tickets.filter((t) => isTicketCompleted(t)).length
  }, [tickets])

  const rejectedCount = useMemo(() => {
    return tickets.filter((t) => isTicketRejected(t)).length
  }, [tickets])

  // Local search & criteria filter
  const displayedTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 0. Project ID filter (Must belong to selectedProjectId)
      if (selectedProjectId && t.projectId && Number(t.projectId) !== Number(selectedProjectId)) {
        return false
      }

      // 1. Scope filter (All Active / Assigned to Me / Raised by Me / Completed / Rejected)
      if (ticketScope === 'active' || (ticketScope as string) === 'all') {
        if (isClosedTicket(t) || isTicketRejected(t)) {
          return false
        }
      } else if (ticketScope === 'assigned_to_me') {
        if (!user || t.assignedToUserId !== user.userId) {
          return false
        }
      } else if (ticketScope === 'raised_by_me') {
        if (!user || (t.createdByUserId !== user.userId && t.assignedByUserId !== user.userId)) {
          return false
        }
      } else if (ticketScope === 'completed') {
        if (!isTicketCompleted(t)) {
          return false
        }
      } else if (ticketScope === 'rejected') {
        if (!isTicketRejected(t)) {
          return false
        }
      }

      // 2. Local Search query
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

      // 3. Status filter
      if (filters.status) {
        const label = TicketStatusLabel[t.status] || String(t.status)
        const f = filters.status.toLowerCase()
        const isComp = isTicketCompleted(t)
        const isRej = isTicketRejected(t)
        if ((f === 'completed' || f === 'closed') && isComp) {
          // match completed
        } else if (f === 'rejected' && isRej) {
          // match rejected
        } else if (label.toLowerCase() !== f) {
          return false
        }
      }

      // 4. Priority filter
      if (filters.priority) {
        const label = PriorityLabel[t.priority] || String(t.priority)
        if (label.toLowerCase() !== filters.priority.toLowerCase()) {
          return false
        }
      }

      // 5. Category filter
      if (filters.category) {
        const label = CategoryLabel[t.category] || String(t.category)
        if (label.toLowerCase() !== filters.category.toLowerCase()) {
          return false
        }
      }

      // 6. Sprint filter
      if (filters.sprintPhase && filters.sprintPhase.trim()) {
        const sprint = (t.sprintPhase || '').toLowerCase()
        if (!sprint.includes(filters.sprintPhase.toLowerCase().trim())) {
          return false
        }
      }

      return true
    })
  }, [tickets, searchQuery, filters, ticketScope, user, selectedProjectId])

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

        <Link
          to={selectedProjectId ? `/app/tickets/new?projectId=${selectedProjectId}` : '/app/tickets/new'}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/35 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Plus className="size-4" />
          New Ticket
        </Link>
      </motion.div>

      {/* ─── Project Selector Bar ────────────────────────────────────────────── */}
      <div className="relative z-30 rounded-2xl border border-line bg-ink-soft p-4 sm:p-5">
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
            {/* 5-Way Scope Toggle: All Active / Assigned to Me / Raised by Me / Completed / Rejected */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
              <button
                type="button"
                onClick={() => {
                  setTicketScope('active')
                  setFilters((f) => ({ ...f, pageNumber: 1 }))
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  ticketScope === 'active'
                    ? 'bg-brand text-paper shadow-md shadow-brand/20'
                    : 'border border-line bg-ink text-paper-muted hover:text-paper hover:border-paper/20'
                }`}
              >
                <TicketIcon className="size-3.5" />
                All Active Tickets ({activeCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  setTicketScope('assigned_to_me')
                  setFilters((f) => ({ ...f, pageNumber: 1 }))
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  ticketScope === 'assigned_to_me'
                    ? 'bg-brand text-paper shadow-md shadow-brand/20'
                    : 'border border-line bg-ink text-paper-muted hover:text-paper hover:border-paper/20'
                }`}
              >
                <User className="size-3.5" />
                Assigned to Me ({assignedToMeCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  setTicketScope('raised_by_me')
                  setFilters((f) => ({ ...f, pageNumber: 1 }))
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  ticketScope === 'raised_by_me'
                    ? 'bg-brand text-paper shadow-md shadow-brand/20'
                    : 'border border-line bg-ink text-paper-muted hover:text-paper hover:border-paper/20'
                }`}
              >
                <Plus className="size-3.5" />
                Raised by Me ({raisedByMeCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  setTicketScope('completed')
                  setFilters((f) => ({ ...f, pageNumber: 1 }))
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  ticketScope === 'completed'
                    ? 'bg-emerald-600 text-paper shadow-md shadow-emerald-950/40'
                    : 'border border-line bg-ink text-emerald-400/90 hover:text-emerald-300 hover:border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                Completed ({completedCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  setTicketScope('rejected')
                  setFilters((f) => ({ ...f, pageNumber: 1 }))
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  ticketScope === 'rejected'
                    ? 'bg-red-600 text-paper shadow-md shadow-red-950/40'
                    : 'border border-line bg-ink text-red-400/90 hover:text-red-300 hover:border-red-500/30'
                }`}
              >
                <XCircle className="size-3.5" />
                Rejected ({rejectedCount})
              </button>
            </div>

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
                  className="rounded-xl border border-line px-3 py-2 text-xs text-paper-muted hover:text-paper cursor-pointer"
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
              icon={
                ticketScope === 'assigned_to_me'
                  ? User
                  : ticketScope === 'completed'
                  ? CheckCircle2
                  : ticketScope === 'rejected'
                  ? XCircle
                  : TicketIcon
              }
              title={
                ticketScope === 'assigned_to_me'
                  ? 'No tickets assigned to you'
                  : ticketScope === 'raised_by_me'
                  ? 'No tickets raised by you'
                  : ticketScope === 'completed'
                  ? 'No completed tickets yet'
                  : ticketScope === 'rejected'
                  ? 'No rejected tickets'
                  : searchQuery || filters.status || filters.priority || filters.category || filters.sprintPhase
                  ? 'No matching tickets found'
                  : 'No tickets found for this project'
              }
              description={
                ticketScope === 'assigned_to_me'
                  ? 'You do not have any tickets assigned to you in this project.'
                  : ticketScope === 'raised_by_me'
                  ? 'You haven’t created any tickets in this project yet.'
                  : ticketScope === 'completed'
                  ? 'Tickets that have been completed and closed will appear here.'
                  : ticketScope === 'rejected'
                  ? 'Tickets rejected by assignees will appear here.'
                  : searchQuery || filters.status || filters.priority || filters.category || filters.sprintPhase
                  ? 'Try clearing or changing the filters to see more tickets.'
                  : 'Create the first ticket for this project to get started.'
              }
              action={
                <Link
                  to={selectedProjectId ? `/app/tickets/new?projectId=${selectedProjectId}` : '/app/tickets/new'}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/35 cursor-pointer"
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
              {displayedTickets
                .slice(
                  ((filters.pageNumber ?? 1) - 1) * (filters.pageSize ?? 10),
                  (filters.pageNumber ?? 1) * (filters.pageSize ?? 10)
                )
                .map((ticket, i) => (
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
          {displayedTickets.length > 0 && (
            <Pagination
              page={filters.pageNumber ?? 1}
              pageSize={filters.pageSize ?? 10}
              total={displayedTickets.length}
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
