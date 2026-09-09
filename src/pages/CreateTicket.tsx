import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import {
  PriorityLabel,
  CategoryLabel,
} from '../lib/constants'
import type {
  ApiResponse,
  CreateTicketPayload,
  Ticket,
  Project,
  ProjectMember,
} from '../lib/types'
import Spinner from '../components/ui/Spinner'
import SearchableSelect from '../components/ui/SearchableSelect'

const ease = [0.22, 1, 0.36, 1] as const

export default function CreateTicket() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const queryProjectId = searchParams.get('projectId')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState<number | ''>(() => {
    if (queryProjectId) return Number(queryProjectId)
    const saved = localStorage.getItem('t_tracker_selected_project_id')
    return saved ? Number(saved) : ''
  })
  const [assignedToUserId, setAssignedToUserId] = useState<number | ''>('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [userStoryId, setUserStoryId] = useState('')
  const [sprintPhase, setSprintPhase] = useState('')
  const [tags, setTags] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [loading, setLoading] = useState(false)

  // Data for dropdowns
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

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
        console.error('Failed to load projects in CreateTicket', err)
      }
    }
    loadProjects()
  }, [])

  useEffect(() => {
    async function loadMembers() {
      if (!projectId) {
        setMembers([])
        setAssignedToUserId('')
        return
      }

      setMembersLoading(true)

      // 1. Try dedicated project members endpoint: GET /api/projects/{projectId}/members
      try {
        let res
        try {
          res = await api.get(`/projects/${projectId}/members`)
        } catch {
          res = await api.get(`/Projects/${projectId}/members`)
        }
        const data = res?.data
        const raw = (data?.success && data?.data) ? data.data : (Array.isArray(data) ? data : data?.members || data?.data || [])
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped = raw.map((m: Record<string, unknown>) => {
            const uId = (m.userId as number) ?? (m.id as number)
            const name = ((m.userName as string) || `${(m.firstName as string) ?? ''} ${(m.lastName as string) ?? ''}`).trim() || (m.email as string) || `Member #${uId}`
            return {
              userId: Number(uId),
              firstName: name,
              lastName: '',
              email: (m.email as string) || '',
              role: (m.role as string) || (m.designation as string) || 'Member',
              designation: (m.designation as string) || '',
              department: (m.department as string) || '',
            }
          })
          setMembers(mapped)
          setMembersLoading(false)
          return
        }
      } catch (err) {
        console.warn('Direct project members failed, trying fallback', err)
      }

      // 2. Try assignable members endpoint: GET /api/projects/{projectId}/members/assignable/members
      try {
        let res
        try {
          res = await api.get(`/projects/${projectId}/members/assignable/members`)
        } catch {
          res = await api.get(`/Projects/${projectId}/members/assignable/members`)
        }
        const data = res?.data
        const list = (data?.success && data?.data) ? data.data : (Array.isArray(data) ? data : data?.members || data?.data || [])
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((m: Record<string, unknown>) => {
            const uId = (m.userId as number) ?? (m.id as number)
            const name = ((m.userName as string) || `${(m.firstName as string) ?? ''} ${(m.lastName as string) ?? ''}`).trim() || (m.email as string) || `Member #${uId}`
            return {
              userId: Number(uId),
              firstName: name,
              lastName: '',
              email: (m.email as string) || '',
              role: (m.role as string) || (m.designation as string) || 'Member',
              designation: (m.designation as string) || '',
              department: (m.department as string) || '',
            }
          })
          setMembers(mapped)
          setMembersLoading(false)
          return
        }
      } catch (err) {
        console.warn('Assignable members failed', err)
      }

      // 3. Try localStorage cache for this project's members
      try {
        const cached = localStorage.getItem(`t_project_members_${projectId}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMembers(
              parsed.map((m: Record<string, unknown>) => ({
                userId: (m.userId as number) || (m.id as number),
                firstName: ((m.userName as string) || `${(m.firstName as string) ?? ''}`).trim() || `User #${m.userId || m.id}`,
                lastName: '',
                email: (m.email as string) || '',
                role: (m.role as string) || 'Member',
                designation: (m.designation as string) || '',
                department: (m.department as string) || '',
              }))
            )
            setMembersLoading(false)
            return
          }
        }
      } catch {
        // ignore
      }

      // Only project members allowed
      setMembers([])
      setMembersLoading(false)
    }

    loadMembers()
  }, [projectId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload: CreateTicketPayload = {
      title,
      description,
      dueDate: new Date(dueDate).toISOString(),
    }
    if (projectId) payload.projectId = Number(projectId)
    if (assignedToUserId) payload.assignedToUserId = Number(assignedToUserId)
    if (priority) payload.priority = priority
    if (category) payload.category = category
    if (userStoryId) payload.userStoryId = userStoryId
    if (sprintPhase) payload.sprintPhase = sprintPhase
    if (tags) payload.tags = tags
    if (estimatedHours) payload.estimatedHours = Number(estimatedHours)

    try {
      const { data } = await api.post<ApiResponse<Ticket>>('/tickets', payload)
      if (data.success) {
        toast('success', 'Ticket created!')
        navigate(`/app/tickets/${data.data.id}`)
      }
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to create ticket',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/app/tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-paper-muted hover:text-paper"
      >
        <ArrowLeft className="size-4" />
        Back to tickets
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="font-display text-2xl font-bold text-paper">
          Create Ticket
        </h1>
        <p className="mt-1 text-sm text-paper-muted">
          Fill in the details below to create a new ticket.
        </p>
      </motion.div>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
        className="space-y-5 rounded-2xl border border-line bg-ink-soft p-6 crazy-form-container shadow-xl shadow-ink/40"
      >
        {/* Title */}
        <FormField label="Title *">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix login bug"
            className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand"
          />
        </FormField>

        {/* Description */}
        <FormField label="Description *">
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue or task…"
            rows={4}
            className="w-full resize-none rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand"
          />
        </FormField>

        {/* Due Date + Project — Highest z-index so dropdown drops over lower rows */}
        <div className="grid grid-cols-2 gap-4 relative z-40">
          <FormField label="Due Date *">
            <input
              required
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand [color-scheme:dark]"
            />
          </FormField>
          <FormField label="Project">
            <SearchableSelect
              options={projects.map((p) => ({
                id: p.id,
                label: p.name,
                sublabel: p.companyName ?? undefined,
                badge: p.status ?? undefined,
              }))}
              value={projectId}
              onChange={(val) => {
                setProjectId(val ? Number(val) : '')
                setAssignedToUserId('')
              }}
              placeholder="Select project..."
              searchPlaceholder="Type project name..."
            />
          </FormField>
        </div>

        {/* Priority + Category */}
        <div className="grid grid-cols-2 gap-4 relative z-30">
          <FormField label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
            >
              <option value="">Select priority</option>
              {Object.values(PriorityLabel).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
            >
              <option value="">Select category</option>
              {Object.values(CategoryLabel).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Assignee — Relative z-20 */}
        <div className="relative z-20">
          <FormField label="Assign To (Project Members Only)">
            <SearchableSelect
              options={members.map((m) => ({
                id: m.userId,
                label: m.firstName || m.email,
                sublabel: m.email,
                badge: m.role || m.department,
              }))}
              value={assignedToUserId}
              onChange={(val) => setAssignedToUserId(val ? Number(val) : '')}
              placeholder={
                !projectId
                  ? 'Select a project first'
                  : membersLoading
                  ? 'Loading project members...'
                  : members.length === 0
                  ? 'No members in this project yet'
                  : 'Search and select project member...'
              }
              searchPlaceholder="Type member name..."
              disabled={!projectId || membersLoading}
            />
          </FormField>
        </div>

        {/* Sprint + Story */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <FormField label="Sprint Phase">
            <input
              value={sprintPhase}
              onChange={(e) => setSprintPhase(e.target.value)}
              placeholder="e.g. Sprint 1"
              className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand"
            />
          </FormField>
          <FormField label="User Story ID">
            <input
              value={userStoryId}
              onChange={(e) => setUserStoryId(e.target.value)}
              placeholder="e.g. US-001"
              className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand"
            />
          </FormField>
        </div>

        {/* Tags + Hours */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <FormField label="Tags">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="auth, critical (comma-separated)"
              className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand"
            />
          </FormField>
          <FormField label="Estimated Hours">
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand"
            />
          </FormField>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/app/tickets"
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-paper-muted hover:bg-line"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/35 disabled:opacity-60 crazy-form-submit"
          >
            {loading ? <Spinner size="sm" /> : 'Create Ticket'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.15em] text-paper-muted">
        {label}
      </span>
      {children}
    </label>
  )
}
