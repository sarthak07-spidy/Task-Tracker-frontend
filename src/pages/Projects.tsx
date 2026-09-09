import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderKanban,
  Plus,
  Users,
  Ticket,
  Calendar,
  AlertCircle,
  UserPlus,
  UserMinus,
  Briefcase,
  Building2,
  Settings,
  Trash2,
  X,
  Check,
  CheckCircle2,
  ArrowRight,
  Search,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Spinner, { PageLoader } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import SearchableSelect from '../components/ui/SearchableSelect'
import Pagination from '../components/ui/Pagination'

const ease = [0.22, 1, 0.36, 1] as const

interface Project {
  id: number
  name: string
  description?: string | null
  companyName?: string | null
  status?: string
  startDate?: string
  endDate?: string | null
  teamSize?: number
  ticketCount?: number
  createdByName?: string
  createdAt?: string
}

interface AssignedProject {
  projectId: number
  projectName: string
  role?: string
  status?: string
}

interface EmployeeUser {
  id: number
  fullName: string
  email: string
  designation?: string
  department?: string
  userType?: string
  assignedProjects?: AssignedProject[]
}

interface ProjectMemberItem {
  id: number // member record or user id
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

const roleOptions = [
  'Developer',
  'DevOps',
  'QA / Tester',
  'UI/UX Designer',
  'Team Lead',
  'Product Manager',
  'Employee',
]

export default function Projects() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [projects, setProjects] = useState<Project[]>([])
  const [statusTab, setStatusTab] = useState<'Active' | 'Completed'>('Active')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 6
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sync searchQuery when URL search param changes
  useEffect(() => {
    const urlQuery = searchParams.get('search') || ''
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery)
      setCurrentPage(1)
    }
  }, [searchParams])

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'Completed'),
    [projects],
  )
  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === 'Completed'),
    [projects],
  )

  const filteredProjects = useMemo(() => {
    let list = statusTab === 'Active' ? activeProjects : completedProjects
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.companyName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      )
    }
    return list
  }, [activeProjects, completedProjects, statusTab, searchQuery])

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredProjects.slice(start, start + PAGE_SIZE)
  }, [filteredProjects, currentPage])

  function handleTabChange(tab: 'Active' | 'Completed') {
    setStatusTab(tab)
    setCurrentPage(1)
  }

  function handleSearchChange(query: string) {
    setSearchQuery(query)
    setCurrentPage(1)
    if (query.trim()) {
      setSearchParams({ search: query.trim() })
    } else {
      setSearchParams({})
    }
  }

  // Permissions
  const canManage =
    user?.role === 'SuperAdmin' ||
    user?.role === 'Manager' ||
    user?.role === 'Admin'

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    companyName: '',
    endDate: '',
  })

  // Selected project for member management
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [projectMembers, setProjectMembers] = useState<ProjectMemberItem[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Add member form state
  const [allEmployees, setAllEmployees] = useState<EmployeeUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [memberRole, setMemberRole] = useState('Developer')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)

  // Edit project modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Delete project modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openDeleteModal(project: Project) {
    setDeletingProject(project)
    setDeleteModalOpen(true)
  }

  async function handleDeleteProject() {
    if (!deletingProject) return
    setDeleteLoading(true)
    try {
      try {
        await api.delete(`/Projects/${deletingProject.id}`)
      } catch {
        await api.delete(`/projects/${deletingProject.id}`)
      }
      toast('success', `Project "${deletingProject.name}" deleted successfully!`)
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id))
      setDeleteModalOpen(false)
      setDeletingProject(null)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to delete project'
      toast('error', msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ─── Fetch Projects ────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await api.get('/projects/all', {
        params: { pageSize: 100 },
      })
      const result = data?.success ? data.data : data
      if (Array.isArray(result)) {
        setProjects(result)
      } else if (result?.projects && Array.isArray(result.projects)) {
        setProjects(result.projects)
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to load projects'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // ─── Fetch All Users for Member Dropdown ────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      // Use /SuperAdmin/users since only SuperAdmin can add members
      const res = await api.get('/SuperAdmin/users')
      const raw = res.data?.success ? res.data.data : res.data
      if (Array.isArray(raw)) {
        setAllEmployees(raw)
      }
    } catch {
      try {
        // Fallback to /Users/employees
        const resAdmin = await api.get('/Users/employees')
        const rawAdmin = resAdmin.data?.success ? resAdmin.data.data : resAdmin.data
        if (Array.isArray(rawAdmin)) {
          setAllEmployees(rawAdmin)
        }
      } catch {
        // silent fallback
      }
    }
  }, [])

  useEffect(() => {
    if (canManage) {
      fetchEmployees()
    }
  }, [canManage, fetchEmployees])

  // ─── Load Project Members ──────────────────────────────────────────────────
  const loadMembersForProject = useCallback(async (project: Project) => {
    setMembersLoading(true)
    try {
      // First attempt direct endpoint
      const { data } = await api.get(`/projects/${project.id}/members`)
      const raw = data?.success ? data.data : data
      if (Array.isArray(raw)) {
        setProjectMembers(
          raw.map((m: Record<string, unknown>) => ({
            id: (m.id as number) ?? (m.userId as number),
            userId: (m.userId as number) || (m.id as number),
            userName:
              (m.userName as string) ||
              `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() ||
              'Team Member',
            email: (m.email as string) || '',
            role: (m.role as string) || 'Member',
            designation: (m.designation as string) || '',
            department: (m.department as string) || '',
          })),
        )
        return
      }
    } catch {
      // Direct endpoint may hit SQL column bug. Fallback to /SuperAdmin/users
      try {
        const empRes = await api.get('/SuperAdmin/users')
        const employees: EmployeeUser[] = empRes.data?.success
          ? empRes.data.data
          : empRes.data
        if (Array.isArray(employees)) {
          const matching = employees
            .filter((emp) =>
              emp.assignedProjects?.some((p) => p.projectId === project.id),
            )
            .map((emp) => {
              const assignment = emp.assignedProjects?.find(
                (p) => p.projectId === project.id,
              )
              return {
                id: emp.id,
                userId: emp.id,
                userName: emp.fullName,
                email: emp.email,
                role: assignment?.role || 'Developer',
                designation: emp.designation,
                department: emp.department,
              }
            })
          setProjectMembers(matching)
        }
      } catch {
        setProjectMembers([])
      }
    } finally {
      setMembersLoading(false)
    }
  }, [])

  function openMemberManagement(project: Project) {
    setSelectedProject(project)
    setSelectedUserId('')
    setMemberRole('Developer')
    setMembersModalOpen(true)
    loadMembersForProject(project)
  }

  // ─── Add Member to Project ──────────────────────────────────────────────────
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProject || !selectedUserId) {
      toast('warning', 'Please select a user to add')
      return
    }

    const emp = allEmployees.find((u) => u.id === Number(selectedUserId))
    setAddMemberLoading(true)

    try {
      const payload = {
        userId: Number(selectedUserId),
        role: memberRole,
        reason: `Assigned to ${selectedProject.name}`,
        userEmail: emp?.email || '',
      }

      await api.post(`/projects/${selectedProject.id}/members/add`, payload)
      toast('success', `${emp?.fullName || 'User'} added to project!`)

      setSelectedUserId('')
      // Refresh member list
      await loadMembersForProject(selectedProject)
      // Refresh projects to update teamSize
      fetchProjects()
      // Refresh employees list
      fetchEmployees()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to add member to project'
      toast('error', msg)
    } finally {
      setAddMemberLoading(false)
    }
  }

  // ─── Remove Member from Project ─────────────────────────────────────────────
  async function handleRemoveMember(memberUserId: number, memberName: string) {
    if (!selectedProject) return
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return
    }

    setRemovingUserId(memberUserId)
    try {
      await api.delete(`/projects/${selectedProject.id}/members/${memberUserId}`)
      toast('info', `${memberName} removed from project`)

      // Update local members list immediately
      setProjectMembers((prev) => prev.filter((m) => m.userId !== memberUserId))
      // Refresh projects to update teamSize
      fetchProjects()
      // Refresh employees
      fetchEmployees()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to remove member'
      toast('error', msg)
    } finally {
      setRemovingUserId(null)
    }
  }

  // ─── Create Project ─────────────────────────────────────────────────────────
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProject.name.trim()) {
      toast('warning', 'Project name is required')
      return
    }

    setCreateLoading(true)
    try {
      const payload: Record<string, string> = {
        name: newProject.name.trim(),
      }
      if (newProject.companyName.trim()) {
        payload.companyName = newProject.companyName.trim()
      }
      if (newProject.description.trim()) {
        payload.description = newProject.description.trim()
      }
      if (newProject.endDate) {
        payload.endDate = new Date(newProject.endDate).toISOString()
      }

      await api.post('/Projects/create', payload)
      toast('success', `Project "${newProject.name}" created successfully!`)

      setCreateModalOpen(false)
      setNewProject({ name: '', description: '', companyName: '', endDate: '' })
      fetchProjects()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to create project'
      toast('error', msg)
    } finally {
      setCreateLoading(false)
    }
  }

  // ─── Edit Project ───────────────────────────────────────────────────────────
  function openEditModal(project: Project) {
    setEditingProject(project)
    setEditModalOpen(true)
  }

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProject || !editingProject.name.trim()) return

    setEditLoading(true)
    try {
      const payload: Record<string, string> = {
        name: editingProject.name.trim(),
      }
      if (editingProject.companyName) payload.companyName = editingProject.companyName.trim()
      if (editingProject.description) payload.description = editingProject.description.trim()
      if (editingProject.endDate) {
        payload.endDate = new Date(editingProject.endDate).toISOString()
      }

      await api.put(`/Projects/${editingProject.id}`, payload)
      toast('success', 'Project updated successfully!')
      setEditModalOpen(false)
      fetchProjects()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to update project'
      toast('error', msg)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleCompleteProject(projId: number, projName: string) {
    if (!window.confirm(`Are you sure you want to mark "${projName}" as Completed?`)) {
      return
    }

    try {
      await api.post(`/Projects/${projId}/complete`)
      toast('success', `Project "${projName}" marked as Completed!`)
      setProjects((prev) =>
        prev.map((p) => (p.id === projId ? { ...p, status: 'Completed' } : p)),
      )
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to mark project as completed'
      toast('error', msg)
    }
  }

  if (loading) return <PageLoader />

  // Filter available employees who are NOT yet in the project
  const currentMemberIds = new Set(projectMembers.map((m) => m.userId))
  const eligibleEmployees = allEmployees.filter(
    (emp) => !currentMemberIds.has(emp.id),
  )

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
          <h1 className="font-display text-2xl font-bold text-paper">Projects</h1>
          <p className="mt-1 text-sm text-paper-muted">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in total
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/35 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" />
            New Project
          </button>
        )}
      </motion.div>

      {/* ─── Search & Tabs Controls Toolbar ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-line pb-4">
        {/* Active vs Completed Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('Active')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              statusTab === 'Active'
                ? 'bg-brand text-paper shadow-md shadow-brand/20'
                : 'border border-line bg-ink-soft text-paper-muted hover:text-paper'
            }`}
          >
            <FolderKanban className="size-4" />
            Active Projects ({activeProjects.length})
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Completed')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              statusTab === 'Completed'
                ? 'bg-brand text-paper shadow-md shadow-brand/20'
                : 'border border-line bg-ink-soft text-paper-muted hover:text-paper'
            }`}
          >
            <CheckCircle2 className="size-4" />
            Completed ({completedProjects.length})
          </button>
        </div>

        {/* Dynamic Search Input */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-paper-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search projects by name, company, or description..."
            className="w-full rounded-xl border border-line bg-ink pl-10 pr-10 py-2.5 text-sm text-paper placeholder:text-paper-muted/50 focus:border-brand focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-paper-muted hover:text-paper hover:bg-line transition-colors"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle className="size-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Dynamic Search Stats feedback */}
      {searchQuery && filteredProjects.length > 0 && (
        <div className="flex items-center justify-between text-xs text-paper-muted">
          <span>
            Found <strong className="text-brand">{filteredProjects.length}</strong> project{filteredProjects.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
          </span>
          <button
            type="button"
            onClick={() => handleSearchChange('')}
            className="text-brand hover:underline font-medium"
          >
            Clear Search
          </button>
        </div>
      )}

      {filteredProjects.length === 0 && !error ? (
        <EmptyState
          icon={FolderKanban}
          title={searchQuery ? 'No matching projects' : (statusTab === 'Active' ? 'No active projects' : 'No completed projects yet')}
          description={
            searchQuery
              ? `No projects matched "${searchQuery}". Try searching for another name or keyword.`
              : statusTab === 'Active'
              ? canManage
                ? 'Click "New Project" above to create your first project.'
                : "Projects will appear here once you're assigned to them."
              : 'Completed projects will appear here once archived or marked complete.'
          }
          action={
            searchQuery ? (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="mt-2 flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-paper"
              >
                Clear Search
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {paginatedProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease }}
                onClick={() => navigate(`/app/projects/${project.id}`)}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-ink-soft p-5 transition-all duration-300 hover:border-cobalt/40 hover:shadow-lg hover:shadow-ink/40 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-xl bg-cobalt/15 p-2.5 shrink-0">
                        <FolderKanban className="size-5 text-cobalt" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-paper group-hover:text-brand transition-colors">
                          {project.name}
                        </h3>
                        {project.companyName && (
                          <p className="truncate text-xs text-paper-muted">
                            {project.companyName}
                          </p>
                        )}
                      </div>
                    </div>

                    {project.status && (
                      <Badge
                        label={project.status}
                        color={statusColor[project.status] ?? '#6b7280'}
                        dot
                        size="sm"
                      />
                    )}
                  </div>

                  {project.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-paper-muted">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-paper-muted">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {project.teamSize ?? 0} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Ticket className="size-3.5" />
                      {project.ticketCount ?? 0} tickets
                    </span>
                    {project.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {new Date(project.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  className="mt-5 border-t border-line/60 pt-3 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Row 1: View Tickets */}
                  <Link
                    to={`/app/tickets?projectId=${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      localStorage.setItem('t_tracker_selected_project_id', String(project.id))
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                  >
                    View Tickets <ArrowRight className="size-3.5" />
                  </Link>

                  {/* Row 2: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {canManage && project.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => handleCompleteProject(project.id, project.name)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95"
                        title="Mark project as Completed"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                    <Link
                      to={`/app/projects/${project.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-paper-muted transition-all hover:border-paper/30 hover:text-paper active:scale-95"
                    >
                      Details
                    </Link>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => openMemberManagement(project)}
                          className="flex items-center gap-1.5 rounded-lg bg-cobalt/10 px-2.5 py-1.5 text-xs font-semibold text-cobalt transition-all hover:bg-cobalt/20 active:scale-95"
                        >
                          <Users className="size-3.5" />
                          Team
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(project)}
                          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-paper-muted transition-all hover:border-paper/30 hover:text-paper active:scale-95"
                        >
                          <Settings className="size-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(project)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
                          title="Delete project"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </motion.div>
            ))}
          </motion.div>

          {/* Pagination Controls (6 projects per page) */}
          {filteredProjects.length > PAGE_SIZE && (
            <div className="rounded-2xl border border-line bg-ink-soft p-4 shadow-sm">
              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredProjects.length}
                onPageChange={(p) => {
                  setCurrentPage(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: Create Project ────────────────────────────────────────── */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-paper-muted">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newProject.name}
              onChange={(e) =>
                setNewProject((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="e.g. Mobile App Redesign"
              className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper placeholder:text-paper-muted/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted">
              Company / Client Name
            </label>
            <input
              type="text"
              value={newProject.companyName}
              onChange={(e) =>
                setNewProject((p) => ({ ...p, companyName: e.target.value }))
              }
              placeholder="e.g. Yendigi Tech"
              className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper placeholder:text-paper-muted/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted">
              Description
            </label>
            <textarea
              rows={3}
              value={newProject.description}
              onChange={(e) =>
                setNewProject((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Brief description of the project goals..."
              className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper placeholder:text-paper-muted/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted">
              Target End Date
            </label>
            <input
              type="date"
              value={newProject.endDate}
              onChange={(e) =>
                setNewProject((p) => ({ ...p, endDate: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-paper-muted hover:bg-ink hover:text-paper"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50"
            >
              {createLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: Manage Team Members ───────────────────────────────────── */}
      <Modal
        open={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        title={`Team Members — ${selectedProject?.name ?? 'Project'}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Add Member Form */}
          <div className="rounded-xl border border-line bg-ink/40 p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-paper">
              <UserPlus className="size-4 text-brand" />
              Add Team Member
            </h3>
            <p className="mt-1 text-xs text-paper-muted">
              Assign an employee to this project. They will be granted access to view
              the project and its tickets.
            </p>

            <form onSubmit={handleAddMember} className="mt-3 flex flex-wrap gap-3">
              <div className="flex-1 min-w-[240px]">
                <SearchableSelect
                  options={eligibleEmployees.map((emp) => ({
                    id: emp.id,
                    label: emp.fullName,
                    sublabel: emp.email,
                    badge: emp.department || emp.designation,
                  }))}
                  value={selectedUserId}
                  onChange={(val) => setSelectedUserId(val ? Number(val) : '')}
                  placeholder="Search and select employee..."
                  searchPlaceholder="Type employee name (e.g. Sarthak)..."
                />
              </div>

              <div className="w-36">
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-paper focus:border-brand focus:outline-none"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={addMemberLoading || !selectedUserId}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-paper shadow-md transition-all hover:opacity-90 disabled:opacity-50"
              >
                {addMemberLoading ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>

          {/* Current Members List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-paper-muted">
              Current Project Members ({projectMembers.length})
            </h3>

            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : projectMembers.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-paper-muted">
                No members assigned yet. Use the form above to assign employees.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-line/60 rounded-xl border border-line bg-ink/20">
                {projectMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3.5 transition-colors hover:bg-ink/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 items-center justify-center rounded-full bg-cobalt/15 text-xs font-bold text-cobalt shrink-0">
                        {member.userName?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-paper">
                          {member.userName}
                        </p>
                        <p className="truncate text-xs text-paper-muted">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded-lg bg-line px-2.5 py-1 text-xs font-medium text-paper">
                        {member.role}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(member.userId, member.userName)
                        }
                        disabled={removingUserId === member.userId}
                        title="Remove member"
                        className="rounded-lg p-1.5 text-paper-muted transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                      >
                        <UserMinus className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ─── MODAL 3: Edit Project ──────────────────────────────────────────── */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Project"
      >
        {editingProject && (
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-paper-muted">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editingProject.name}
                onChange={(e) =>
                  setEditingProject((p) =>
                    p ? { ...p, name: e.target.value } : null,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-paper focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-paper-muted">
                Company / Client Name
              </label>
              <input
                type="text"
                value={editingProject.companyName ?? ''}
                onChange={(e) =>
                  setEditingProject((p) =>
                    p ? { ...p, companyName: e.target.value } : null,
                  )
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
                value={editingProject.description ?? ''}
                onChange={(e) =>
                  setEditingProject((p) =>
                    p ? { ...p, description: e.target.value } : null,
                  )
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
        )}
      </Modal>

      {/* ─── MODAL 4: Delete Project Confirmation ─────────────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false)
            setDeletingProject(null)
          }
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
                {deletingProject?.name}
              </strong>{' '}
              and all of its associated tickets, assignments, and data. This action cannot be undone.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => {
                setDeleteModalOpen(false)
                setDeletingProject(null)
              }}
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
