import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
import Parallax3DCard from '../components/ui/Parallax3DCard'

const ease = [0.22, 1, 0.36, 1] as const

export default function CreateTicket() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState<number | ''>('')
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

  useEffect(() => {
    async function loadMembers() {
      // First attempt assignable members endpoint
      if (projectId) {
        try {
          const { data } = await api.get(
            `/projects/${projectId}/members/assignable/members`,
          )
          const list = data?.success ? data.data : data
          if (Array.isArray(list) && list.length > 0) {
            setMembers(list)
            return
          }
        } catch {
          // fallback to /Users/employees
        }
      }

      // Resilient fallback: fetch from /Users/employees
      try {
        const empRes = await api.get('/Users/employees')
        const raw = empRes.data?.success ? empRes.data.data : empRes.data
        if (Array.isArray(raw)) {
          let targetList = raw
          if (projectId) {
            const matching = raw.filter((emp: { assignedProjects?: Array<{ projectId: number }> }) =>
              emp.assignedProjects?.some((p) => p.projectId === Number(projectId)),
            )
            // If some employees are assigned to this project, show them; otherwise show all employees
            if (matching.length > 0) {
              targetList = matching
            }
          }

          setMembers(
            targetList.map((u: { id: number; fullName?: string; email: string; userType?: string; designation?: string; department?: string }) => {
              const parts = (u.fullName ?? '').split(' ')
              return {
                userId: u.id,
                firstName: parts[0] || '',
                lastName: parts.slice(1).join(' ') || '',
                email: u.email,
                role: u.userType || u.designation || 'Employee',
                designation: u.designation,
                department: u.department,
              }
            }),
          )
        }
      } catch {
        setMembers([])
      }
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

      <Parallax3DCard intensity={7} glare={true} depthEffect={true}>
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="space-y-5 rounded-2xl border border-line bg-ink-soft p-6 crazy-form-container"
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

        {/* Due Date + Project */}
        <div className="grid grid-cols-2 gap-4">
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
              onChange={(val) => setProjectId(val ? Number(val) : '')}
              placeholder="Select project..."
              searchPlaceholder="Type project name..."
            />
          </FormField>
        </div>

        {/* Priority + Category */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* Assignee */}
        <FormField label="Assign To">
          <SearchableSelect
            options={members.map((m) => ({
              id: m.userId,
              label: `${m.firstName} ${m.lastName}`.trim() || m.email,
              sublabel: m.email,
              badge: m.role || m.department,
            }))}
            value={assignedToUserId}
            onChange={(val) => setAssignedToUserId(val ? Number(val) : '')}
            placeholder="Search and select team member..."
            searchPlaceholder="Type member name (e.g. Sarthak)..."
          />
        </FormField>

        {/* Sprint + Story */}
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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
      </Parallax3DCard>
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
