import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderKanban,
  ArrowLeft,
  Plus,
  Users,
  Ticket as TicketIcon,
  Calendar,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  Settings,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Spinner, { PageLoader } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import SearchableSelect from '../components/ui/SearchableSelect'
import {
  TicketStatusLabel,
  TicketStatusColor,
  TicketStatusBg,
  PriorityLabel,
  PriorityColor,
  CategoryLabel,
} from '../lib/constants'
import type { Ticket, Project } from '../lib/types'

const ease = [0.22, 1, 0.36, 1] as const

interface EmployeeUser {
  id: number
  fullName: string
  email: string
  designation?: string
  department?: string
  userType?: string
  assignedProjects?: Array<{ projectId: number; projectName: string; role?: string }>
}

interface ProjectMemberItem {
  userId: number
  userName: string
  email: string
  role: string
  designation?: string
  department?: string
}

const statusColor: Record<string, string> = {
  Active: '#22c55e',
  Completed: '#3b82f6',
  OnHold: '#f59e0b',
  Cancelled: '#ef4444',
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const projectId = Number(id)
  const canManage =
    user?.role === 'SuperAdmin' ||
    user?.role === 'Manager' ||
    user?.role === 'Admin'

  const [project, setProject] = useState<Project | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [members, setMembers] = useState<ProjectMemberItem[]>([])
  const [allEmployees, setAllEmployees] = useState<EmployeeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Active tab: 'tickets' | 'team' | 'info'
  const [activeTab, setActiveTab] = useState<'tickets' | 'team' | 'info'>('tickets')

  // Ticket filtering & search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL')

  // Add member state
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [memberRole, setMemberRole] = useState('Developer')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)

  // Edit project state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    companyName: '',
    endDate: '',
  })
  const [editLoading, setEditLoading] = useState(false)

  // ─── Fetch Project Details ───────────────────────────────────────────────────
  const fetchProjectData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')

    try {
      // 1. Fetch Project Details
      let projData: Project | null = null
      try {
        const { data } = await api.get(`/Projects/${projectId}`)
        projData = (data?.success && data?.data) ? data.data : data
      } catch {
        // Fallback: fetch from /projects/all
        const { data } = await api.get('/projects/all', { params: { pageSize: 100 } })
        const list = data?.success ? data.data : data
        const arr = Array.isArray(list) ? list : (list?.projects ?? [])
        projData = arr.find((p: Project) => p.id === projectId) ?? null
      }

      if (projData) {
        setProject(projData)
        setEditForm({
          name: projData.name ?? '',
          description: projData.description ?? '',
          companyName: projData.companyName ?? '',
          endDate: projData.endDate ? projData.endDate.split('T')[0] : '',
        })
      } else {
        setError('Project not found')
      }

      // 2. Fetch Tickets for this project
      try {
        const { data: ticketData } = await api.get('/tickets', {
          params: { projectId, pageSize: 100 },
        })
        const tResult = ticketData?.success ? ticketData.data : ticketData
        const tList: Ticket[] = tResult?.tickets ?? (Array.isArray(tResult) ? tResult : [])
        // Ensure only this project's tickets if API didn't filter
        const filtered = tList.filter((t) => !t.projectId || t.projectId === projectId)
        setTickets(filtered)
      } catch {
        setTickets([])
      }

      // 3a. Fetch actual project members from dedicated endpoint
      try {
        const membersRes = await api.get(`/projects/${projectId}/members`)
        const membersRaw = membersRes.data?.success ? membersRes.data.data : membersRes.data
        if (Array.isArray(membersRaw) && membersRaw.length > 0) {
          const projectMembersList = membersRaw.map((m: Record<string, unknown>) => ({
            userId: (m.userId as number) || (m.id as number),
            userName: (m.userName as string) || `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Team Member',
            email: (m.email as string) || '',
            role: (m.role as string) || 'Developer',
            designation: (m.designation as string) || '',
            department: (m.department as string) || '',
          }))
          setMembers(projectMembersList)
          try {
            localStorage.setItem(`t_project_members_${projectId}`, JSON.stringify(projectMembersList))
          } catch {}
        } else {
          // If empty from API, try localStorage cache
          const cached = localStorage.getItem(`t_project_members_${projectId}`)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed) && parsed.length > 0) setMembers(parsed)
          }
        }
      } catch {
        // Fallback to localStorage
        try {
          const cached = localStorage.getItem(`t_project_members_${projectId}`)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed) && parsed.length > 0) setMembers(parsed)
          }
        } catch {}
      }

      // 3b. Fetch all users for the "Add Member" dropdown (SuperAdmin only)
      try {
        const empRes = await api.get('/SuperAdmin/users')
        const employees: EmployeeUser[] = empRes.data?.success
          ? empRes.data.data
          : empRes.data
        if (Array.isArray(employees)) {
          setAllEmployees(employees)
        }
      } catch {
        // Fallback to /Users/employees
        try {
          const empRes2 = await api.get('/Users/employees')
          const employees2: EmployeeUser[] = empRes2.data?.success ? empRes2.data.data : empRes2.data
          if (Array.isArray(employees2)) setAllEmployees(employees2)
        } catch {}
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to load project details'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProjectData()
  }, [fetchProjectData])

  // ─── Add Team Member ────────────────────────────────────────────────────────
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId) {
      toast('warning', 'Please select an employee to add')
      return
    }

    const emp = allEmployees.find((u) => u.id === Number(selectedUserId))
    setAddMemberLoading(true)

    try {
      const payload = {
        userId: Number(selectedUserId),
        role: memberRole,
        reason: `Assigned to ${project?.name ?? 'project'}`,
        userEmail: emp?.email || '',
      }

      await api.post(`/projects/${projectId}/members/add`, payload)
      toast('success', `${emp?.fullName || 'Member'} added to project!`)

      setSelectedUserId('')
      // Refresh member list
      fetchProjectData()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to add member'
      toast('error', msg)
    } finally {
      setAddMemberLoading(false)
    }
  }

  // ─── Remove Team Member ─────────────────────────────────────────────────────
  async function handleRemoveMember(memberUserId: number, memberName: string) {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return
    }

    setRemovingUserId(memberUserId)
    try {
      await api.delete(`/projects/${projectId}/members/${memberUserId}`)
      toast('info', `${memberName} removed from project`)
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId))
      fetchProjectData()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to remove member'
      toast('error', msg)
    } finally {
      setRemovingUserId(null)
    }
  }

  // ─── Edit Project ───────────────────────────────────────────────────────────
  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.name.trim()) return

    setEditLoading(true)
    try {
      const payload: Record<string, string> = {
        name: editForm.name.trim(),
      }
      if (editForm.companyName) payload.companyName = editForm.companyName.trim()
      if (editForm.description) payload.description = editForm.description.trim()
      if (editForm.endDate) payload.endDate = new Date(editForm.endDate).toISOString()

      await api.put(`/Projects/${projectId}`, payload)
      toast('success', 'Project updated successfully!')
      setEditModalOpen(false)
      fetchProjectData()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to update project'
      toast('error', msg)
    } finally {
      setEditLoading(false)
    }
  }

  // ─── Mark Project Complete ──────────────────────────────────────────────────
  const [completeLoading, setCompleteLoading] = useState(false)

  async function handleCompleteProject() {
    if (!project) return
    if (!window.confirm(`Are you sure you want to mark "${project.name}" as Completed?`)) {
      return
    }

    setCompleteLoading(true)
    try {
      await api.post(`/Projects/${projectId}/complete`)
      toast('success', `Project "${project.name}" marked as Completed!`)
      setProject((prev) => (prev ? { ...prev, status: 'Completed' } : null))
      fetchProjectData()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to complete project'
      toast('error', msg)
    } finally {
      setCompleteLoading(false)
    }
  }

  // ─── Delete Project ────────────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleDeleteProject() {
    if (!project) return
    setDeleteLoading(true)
    try {
      try {
        await api.delete(`/Projects/${project.id}`)
      } catch {
        await api.delete(`/projects/${project.id}`)
      }
      toast('success', `Project "${project.name}" deleted successfully!`)
      navigate('/app/projects')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to delete project'
      toast('error', msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ─── Filtered Tickets ───────────────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search query (title, description, tags, story id)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = t.title.toLowerCase().includes(q)
        const descMatch = t.description?.toLowerCase().includes(q)
        const storyMatch = t.userStoryId?.toLowerCase().includes(q)
        const tagMatch = t.tags?.toLowerCase().includes(q)
        if (!titleMatch && !descMatch && !storyMatch && !tagMatch) return false
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (String(t.status) !== statusFilter) return false
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if (String(t.priority) !== priorityFilter) return false
      }

      // Assignee filter
      if (assigneeFilter !== 'ALL') {
        if (String(t.assignedToUserId) !== assigneeFilter) return false
      }

      return true
    })
  }, [tickets, searchQuery, statusFilter, priorityFilter, assigneeFilter])

  if (loading) return <PageLoader />

  if (error || !project) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="mb-4 inline-flex rounded-2xl bg-red-500/15 p-4 text-red-400">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-paper">
          Project Not Found
        </h2>
        <p className="mt-2 text-sm text-paper-muted">
          {error || 'Unable to retrieve project details.'}
        </p>
        <Link
          to="/app/projects"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-paper"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </Link>
      </div>
    )
  }

  // Available employees not yet in this project
  const currentMemberIds = new Set(members.map((m) => m.userId))
  const eligibleEmployees = allEmployees.filter(
    (emp) => !currentMemberIds.has(emp.id),
  )

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-paper-muted transition-colors hover:text-paper"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </Link>

        <div className="flex items-center gap-2">
          {canManage && project.status !== 'Completed' && (
            <button
              type="button"
              onClick={handleCompleteProject}
              disabled={completeLoading}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50 shadow-sm"
              title="Mark project as Completed"
            >
              {completeLoading ? (
                <Spinner size="sm" />
              ) : (
                <CheckCircle2 className="size-3.5 text-emerald-400" />
              )}
              <span>Mark Completed</span>
            </button>
          )}

          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium text-paper-muted transition-all hover:border-paper/30 hover:text-paper"
              >
                <Settings className="size-3.5" />
                Settings
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
                title="Delete project"
              >
                <Trash2 className="size-3.5" />
                Delete Project
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => navigate(`/app/tickets/new?projectId=${project.id}`)}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-paper shadow-md transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Project Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative overflow-hidden rounded-3xl border border-line bg-ink-soft p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-cobalt/15 text-cobalt">
                <FolderKanban className="size-6" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-paper">
                {project.name}
              </h1>
              {project.status && (
                <Badge
                  label={project.status}
                  color={statusColor[project.status] ?? '#22c55e'}
                  dot
                  size="md"
                />
              )}
            </div>

            {project.companyName && (
              <p className="flex items-center gap-1.5 text-sm text-paper-muted">
                <Building2 className="size-4 text-paper-muted/60" />
                {project.companyName}
              </p>
            )}

            {project.description && (
              <p className="max-w-2xl text-sm leading-relaxed text-paper/80 pt-1">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-line/60 bg-ink/40 px-4 py-3 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-paper">
                {tickets.length}
              </span>
              <span className="text-[11px] font-medium text-paper-muted uppercase tracking-wider">
                Tickets
              </span>
            </div>

            <div className="rounded-2xl border border-line/60 bg-ink/40 px-4 py-3 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-cobalt">
                {Math.max(members.length, project?.teamSize ?? 0)}
              </span>
              <span className="text-[11px] font-medium text-paper-muted uppercase tracking-wider">
                Team
              </span>
            </div>

            {project.createdAt && (
              <div className="rounded-2xl border border-line/60 bg-ink/40 px-4 py-3 text-center min-w-[110px]">
                <span className="block text-xs font-semibold text-paper pt-1">
                  {new Date(project.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-[11px] font-medium text-paper-muted uppercase tracking-wider">
                  Created
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-8 flex border-b border-line gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'tickets'
                ? 'border-brand text-brand'
                : 'border-transparent text-paper-muted hover:text-paper'
            }`}
          >
            <TicketIcon className="size-4" />
            Tickets ({tickets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'team'
                ? 'border-brand text-brand'
                : 'border-transparent text-paper-muted hover:text-paper'
            }`}
          >
            <Users className="size-4" />
            Team Members ({Math.max(members.length, project?.teamSize ?? 0)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-brand text-brand'
                : 'border-transparent text-paper-muted hover:text-paper'
            }`}
          >
            <FolderKanban className="size-4" />
            Project Details
          </button>
        </div>
      </motion.div>

      {/* ─── TAB 1: TICKETS ──────────────────────────────────────────────────── */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Search & Filters Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-ink-soft p-4 md:flex-row md:items-center md:justify-between">
            {/* Search input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-paper-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets by title, story ID, tags..."
                className="w-full rounded-xl border border-line bg-ink pl-10 pr-4 py-2.5 text-sm text-paper placeholder:text-paper-muted/50 focus:border-brand focus:outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-line bg-ink px-3 py-2 text-xs font-medium text-paper focus:border-brand focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                {Object.entries(TicketStatusLabel).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-line bg-ink px-3 py-2 text-xs font-medium text-paper focus:border-brand focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                {Object.entries(PriorityLabel).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Assignee Filter */}
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="rounded-xl border border-line bg-ink px-3 py-2 text-xs font-medium text-paper focus:border-brand focus:outline-none"
              >
                <option value="ALL">All Assignees</option>
                {members.map((m) => (
                  <option key={m.userId} value={String(m.userId)}>
                    {m.userName}
                  </option>
                ))}
              </select>

              {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('ALL')
                    setPriorityFilter('ALL')
                    setAssigneeFilter('ALL')
                  }}
                  className="text-xs text-brand hover:underline px-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-line bg-ink-soft p-12 text-center">
              <TicketIcon className="mx-auto size-8 text-paper-muted/60 mb-3" />
              <h3 className="font-semibold text-paper">No tickets found</h3>
              <p className="mt-1 text-xs text-paper-muted max-w-sm mx-auto">
                {tickets.length === 0
                  ? 'No tickets have been created for this project yet.'
                  : 'No tickets matched your current search or filter criteria.'}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/app/tickets/new?projectId=${project.id}`)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-paper"
              >
                <Plus className="size-3.5" />
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/app/tickets/${ticket.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-ink-soft p-5 transition-all hover:border-paper/30 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-paper-muted">
                        #{ticket.id}
                        {ticket.userStoryId ? ` · ${ticket.userStoryId}` : ''}
                      </span>
                      <div className="flex items-center gap-1.5">
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
                    </div>

                    <h3 className="mt-3 font-semibold text-paper group-hover:text-brand transition-colors line-clamp-2">
                      {ticket.title}
                    </h3>

                    {ticket.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-paper-muted">
                        {ticket.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-paper-muted">
                    <span className="truncate">
                      {ticket.assignedToName ? `👤 ${ticket.assignedToName}` : 'Unassigned'}
                    </span>
                    {ticket.dueDate && (
                      <span className="shrink-0 flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(ticket.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TEAM MEMBERS ────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Add Member Box (SuperAdmin/Manager) */}
          {canManage && (
            <div className="rounded-2xl border border-line bg-ink-soft p-6">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-paper">
                <UserPlus className="size-4 text-brand" />
                Assign Member to {project.name}
              </h3>
              <p className="mt-1 text-xs text-paper-muted">
                Type the name or email of any employee to quickly add them to this project.
              </p>

              <form onSubmit={handleAddMember} className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[260px]">
                  <SearchableSelect
                    options={eligibleEmployees.map((emp) => ({
                      id: emp.id,
                      label: emp.fullName,
                      sublabel: emp.email,
                      badge: emp.department || emp.designation,
                    }))}
                    value={selectedUserId}
                    onChange={(val) => setSelectedUserId(val ? Number(val) : '')}
                    placeholder="Search employee by name (e.g. Sarthak)..."
                    searchPlaceholder="Type name or email to filter..."
                  />
                </div>

                <div className="w-40">
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full rounded-xl border border-line bg-ink px-3 py-2.5 text-sm text-paper focus:border-brand focus:outline-none"
                  >
                    <option value="Developer">Developer</option>
                    <option value="DevOps">DevOps</option>
                    <option value="QA / Tester">QA / Tester</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addMemberLoading || !selectedUserId}
                  className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-paper shadow-md transition-all hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  {addMemberLoading ? 'Adding...' : 'Add Member'}
                </button>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="rounded-2xl border border-line bg-ink-soft p-6">
            <h3 className="font-display text-base font-bold text-paper">
              Active Project Members ({members.length})
            </h3>
            <p className="mt-1 text-xs text-paper-muted">
              These members have access to view and collaborate on this project.
            </p>

            {members.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line p-8 text-center text-sm text-paper-muted">
                No members assigned to this project yet. Use the search box above to add team members.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-xl border border-line/60 bg-ink/30 p-4 transition-all hover:border-paper/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-cobalt/15 text-sm font-bold text-cobalt shrink-0">
                        {member.userName?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-paper">
                          {member.userName}
                        </p>
                        <p className="truncate text-xs text-paper-muted">
                          {member.email}
                        </p>
                        <span className="mt-1 inline-block rounded-md bg-line px-2 py-0.5 text-[10px] font-medium text-paper-muted">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId, member.userName)}
                        disabled={removingUserId === member.userId}
                        className="rounded-lg p-2 text-paper-muted hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-50 ml-2"
                        title="Remove member"
                      >
                        <UserMinus className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: PROJECT INFO ─────────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="rounded-2xl border border-line bg-ink-soft p-6 sm:p-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
                Project Name
              </label>
              <p className="mt-1 text-base font-semibold text-paper">{project.name}</p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
                Company / Client
              </label>
              <p className="mt-1 text-base font-semibold text-paper">
                {project.companyName || 'None specified'}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
                Status
              </label>
              <div className="mt-1.5">
                <Badge
                  label={project.status || 'Active'}
                  color={statusColor[project.status || 'Active'] ?? '#22c55e'}
                  dot
                  size="sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
                Created Date
              </label>
              <p className="mt-1 text-sm text-paper">
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="border-t border-line/60 pt-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
              Description
            </label>
            <p className="mt-2 text-sm leading-relaxed text-paper/90 whitespace-pre-wrap">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          {/* Team Members in Project Details */}
          <div className="border-t border-line/60 pt-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-paper-muted flex items-center gap-2">
              <Users className="size-3.5" />
              Team Members ({members.length})
            </label>
            {members.length === 0 ? (
              <p className="mt-3 text-sm text-paper-muted italic">No members assigned to this project yet.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 rounded-xl border border-line/60 bg-ink/40 px-4 py-3"
                  >
                    {/* Avatar */}
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-bold text-brand uppercase">
                      {(m.userName || 'U').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-paper">{m.userName}</p>
                      <p className="truncate text-xs text-paper-muted">{m.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {m.role && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                            {m.role}
                          </span>
                        )}
                        {m.department && (
                          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-paper-muted border border-line/60">
                            {m.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Project ─────────────────────────────────────────────── */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Project Details"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-paper-muted">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted">
              Company / Client Name
            </label>
            <input
              type="text"
              value={editForm.companyName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, companyName: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted">
              Description
            </label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-paper-muted hover:bg-ink hover:text-paper"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Project Confirmation Modal ─────────────────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteModalOpen(false)
        }}
        title="Delete Project"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <AlertCircle className="size-6 shrink-0 text-red-400" />
            <div className="text-xs leading-relaxed text-red-300">
              <span className="font-semibold block text-sm text-red-200">
                Are you sure you want to delete this project?
              </span>
              This will permanently delete{' '}
              <strong className="text-paper font-semibold">
                {project?.name}
              </strong>{' '}
              and all of its associated tickets, assignments, and data. This action cannot be undone.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-paper-muted hover:bg-ink hover:text-paper cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDeleteProject}
              className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {deleteLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  <span>Delete Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
