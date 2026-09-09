import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Ticket,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  FolderKanban,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  TicketStatusLabel,
  TicketStatusColor,
  TicketStatusBg,
  PriorityLabel,
  PriorityColor,
} from '../lib/constants'
import type { UserDashboard, Ticket as TicketType, Project } from '../lib/types'
import Badge from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import Parallax3DCard from '../components/ui/Parallax3DCard'

const ease = [0.22, 1, 0.36, 1] as const

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) return
    const duration = 800
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{display}</>
}

interface StatCard {
  label: string
  value: number
  icon: typeof Ticket
  color: string
  bg: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [dashData, setDashData] = useState<UserDashboard | null>(null)
  const [projectsList, setProjectsList] = useState<Project[]>([])
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const isSuperAdmin = user?.role === 'SuperAdmin'

        const fetchDash = async () => {
          if (isSuperAdmin) {
            try {
              return await api.get('/SuperAdmin/dashboard')
            } catch {
              return await api.get('/Users/dashboard')
            }
          }
          return await api.get('/Users/dashboard')
        }

        const fetchProjects = async () => {
          try {
            return await api.get('/Projects/all')
          } catch {
            return await api.get('/projects/all')
          }
        }

        const fetchTickets = async () => {
          try {
            return await api.get('/Tickets', { params: { pageNumber: 1, pageSize: 5 } })
          } catch {
            return await api.get('/tickets', { params: { pageNumber: 1, pageSize: 5 } })
          }
        }

        const [dashRes, projectsRes, ticketsRes] = await Promise.allSettled([
          fetchDash(),
          fetchProjects(),
          fetchTickets(),
        ])

        if (!isMounted) return

        let dash: UserDashboard | null = null

        if (dashRes.status === 'fulfilled' && dashRes.value) {
          const raw = dashRes.value.data
          const d = raw?.success && raw?.data ? raw.data : (raw?.data ?? raw)
          if (d && typeof d === 'object') {
            dash = d as UserDashboard
          }
        }

        let projectsCount = 0
        let activeCount = 0
        if (projectsRes.status === 'fulfilled') {
          const rawP = projectsRes.value.data
          const d = (rawP?.success && rawP?.data) ? rawP.data : (rawP?.data ?? rawP)
          const pList = Array.isArray(d) ? d : (d?.projects ?? [])
          if (Array.isArray(pList)) {
            setProjectsList(pList)
            projectsCount = pList.length
            activeCount = pList.filter(
              (p: { status?: string }) =>
                p.status?.toLowerCase() !== 'completed',
            ).length
          }
        }

        if (!dash) {
          dash = {
            totalProjects: projectsCount,
            activeProjects: activeCount,
            completedProjects: Math.max(0, projectsCount - activeCount),
            totalTickets: 0,
            inProgressTickets: 0,
            completedTickets: 0,
            pendingApprovalTickets: 0,
            totalEmployees: 0,
          }
        } else {
          if (!dash.totalProjects && projectsCount) dash.totalProjects = projectsCount
          if (!dash.activeProjects && activeCount) dash.activeProjects = activeCount
          if (!dash.completedProjects && projectsCount) {
            dash.completedProjects = Math.max(0, projectsCount - activeCount)
          }
        }

        setDashData(dash)

        if (ticketsRes.status === 'fulfilled') {
          const raw = ticketsRes.value.data
          const d = raw?.success && raw?.data ? raw.data : (raw?.data ?? raw)
          const tickets = d?.tickets ?? (Array.isArray(d) ? d : [])
          if (Array.isArray(tickets)) {
            setRecentTickets(tickets)
            if (dash && !dash.totalTickets && tickets.length > 0) {
              dash.totalTickets = tickets.length
            }
          }
        }
      } catch {
        if (isMounted) setError('An unexpected error occurred.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const displayedActiveProjects = useMemo(() => {
    if (dashData?.recentProjects && dashData.recentProjects.length > 0) {
      return dashData.recentProjects
    }
    return projectsList
  }, [dashData?.recentProjects, projectsList])

  if (loading) return <PageLoader />

  const stats: StatCard[] = [
    {
      label: 'Total Projects',
      value: dashData?.totalProjects ?? 0,
      icon: FolderKanban,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
    },
    {
      label: 'Active Projects',
      value: dashData?.activeProjects ?? (dashData?.inProgressTickets ?? 0),
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      label: 'Total Tickets',
      value: dashData?.totalTickets ?? 0,
      icon: Ticket,
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.12)',
    },
    {
      label: 'Completed Projects',
      value: dashData?.completedProjects ?? 0,
      icon: CheckCircle2,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="font-display text-3xl font-bold tracking-tight text-paper">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="mt-1 text-paper-muted">
          Here's what's happening across your projects today.
        </p>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle className="size-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
            >
              <Parallax3DCard intensity={12} glare={true} depthEffect={true}>
                <div
                  className={`group relative overflow-hidden rounded-2xl border border-line bg-ink-soft p-5 transition-all duration-300 hover:border-paper/20 hover:shadow-lg hover:shadow-ink/40 crazy-stat-card-${i}`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-6 -top-6 size-24 rounded-full opacity-30 transition-opacity group-hover:opacity-50"
                    style={{ backgroundColor: stat.bg }}
                  />
                  <div className="relative">
                    <div
                      className="flex size-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <Icon className="size-5" style={{ color: stat.color }} />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-paper">
                      <AnimatedCount value={stat.value} />
                    </p>
                    <p className="text-xs font-medium text-paper-muted">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Parallax3DCard>
            </motion.div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Quick Actions + Recent Projects */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease }}
            className="rounded-2xl border border-line bg-ink-soft p-6"
          >
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-paper">
              <TrendingUp className="size-5 text-brand" />
              Quick Actions
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/app/tickets/new"
                className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-paper transition-all hover:border-brand/40 hover:bg-brand/5 crazy-action-btn"
              >
                <div className="rounded-lg bg-brand/15 p-2">
                  <Plus className="size-4 text-brand" />
                </div>
                Create New Ticket
                <ArrowRight className="ml-auto size-4 text-paper-muted" />
              </Link>
              <Link
                to="/app/tickets"
                className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-paper transition-all hover:border-amber/40 hover:bg-amber/5 crazy-action-btn"
              >
                <div className="rounded-lg bg-amber/15 p-2">
                  <Ticket className="size-4 text-amber" />
                </div>
                View All Tickets
                <ArrowRight className="ml-auto size-4 text-paper-muted" />
              </Link>
              <Link
                to="/app/projects"
                className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-paper transition-all hover:border-cobalt/40 hover:bg-cobalt/5 crazy-action-btn"
              >
                <div className="rounded-lg bg-cobalt/15 p-2">
                  <FolderKanban className="size-4 text-cobalt" />
                </div>
                Browse Projects
                <ArrowRight className="ml-auto size-4 text-paper-muted" />
              </Link>
            </div>
          </motion.div>

          {/* Active Projects: Show strictly 2 and view more / direct tickets link */}
          {displayedActiveProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease }}
              className="rounded-2xl border border-line bg-ink-soft p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-paper">
                  <FolderKanban className="size-5 text-cobalt" />
                  Active Projects
                </h2>
                <Link
                  to="/app/projects"
                  className="text-xs font-medium text-brand transition-colors hover:text-brand/80"
                >
                  View all →
                </Link>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {displayedActiveProjects.slice(0, 2).map((proj) => (
                  <Link
                    key={proj.id}
                    to={`/app/tickets?projectId=${proj.id}`}
                    onClick={() => {
                      localStorage.setItem('t_tracker_selected_project_id', String(proj.id))
                    }}
                    className="group block rounded-xl border border-line/50 bg-ink/30 p-4 transition-all hover:border-cobalt/40 hover:bg-ink/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-paper group-hover:text-brand">
                        {proj.name}
                      </p>
                      {proj.status && (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          {proj.status}
                        </span>
                      )}
                    </div>
                    {proj.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-paper-muted">
                        {proj.description}
                      </p>
                    )}
                    {proj.companyName && (
                      <p className="mt-2 text-[11px] text-paper-muted/80">
                        {proj.companyName}
                      </p>
                    )}
                  </Link>
                ))}
                {displayedActiveProjects.length > 2 && (
                  <Link
                    to="/app/projects"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line/60 py-2.5 text-xs font-medium text-paper-muted transition-all hover:border-brand/40 hover:text-brand"
                  >
                    <span>+{displayedActiveProjects.length - 2} more projects</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="rounded-2xl border border-line bg-ink-soft p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-paper">
              <Clock className="size-5 text-amber" />
              Recent Tickets
            </h2>
            <Link
              to="/app/tickets"
              className="text-xs font-medium text-brand transition-colors hover:text-brand/80"
            >
              View all →
            </Link>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {recentTickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-paper-muted">
                No tickets yet. Create your first one!
              </p>
            ) : (
              recentTickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                >
                  <Link
                    to={`/app/tickets/${ticket.id}`}
                    className="flex items-center gap-4 rounded-xl border border-transparent px-4 py-3 transition-all hover:border-line hover:bg-ink/60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-paper">
                        {ticket.title}
                      </p>
                      <p className="mt-0.5 text-xs text-paper-muted">
                        {ticket.assignedToName
                          ? `Assigned to ${ticket.assignedToName}`
                          : 'Unassigned'}{' '}
                        ·{' '}
                        {new Date(ticket.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        label={PriorityLabel[ticket.priority] ?? 'Medium'}
                        color={PriorityColor[ticket.priority] ?? '#f59e0b'}
                        size="sm"
                      />
                      <Badge
                        label={TicketStatusLabel[ticket.status] ?? 'Open'}
                        color={TicketStatusColor[ticket.status] ?? '#3b82f6'}
                        bg={TicketStatusBg[ticket.status]}
                        dot
                        size="sm"
                      />
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
