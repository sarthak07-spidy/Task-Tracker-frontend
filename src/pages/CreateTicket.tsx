import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import {
  Priority,
  PriorityLabel,
  Category,
  CategoryLabel,
} from '../lib/constants'
import type {
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
  const { user } = useAuth()
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
  const [assignedToUserId, setAssignedToUserId] = useState<number | string | ''>('')
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

      const mapMember = (m: Record<string, unknown>, index: number): ProjectMember => {
        const email = ((m.email as string) || (m.Email as string) || '').trim()

        // Prioritize UserId / userId (Users table foreign key) over Id / id (ProjectMembers primary key)
        const rawUserId = m.userId ?? m.UserId ?? m.user_id
        const rawMemberId = m.id ?? m.Id
        const numUserId = rawUserId !== undefined && rawUserId !== null ? Number(rawUserId) : NaN
        const numMemberId = rawMemberId !== undefined && rawMemberId !== null ? Number(rawMemberId) : NaN

        let finalId: number | string = ''
        if (!isNaN(numUserId) && numUserId > 0) {
          finalId = numUserId
        } else if (!isNaN(numMemberId) && numMemberId > 0) {
          finalId = numMemberId
        } else if (email) {
          finalId = email
        } else {
          finalId = `member-${index}`
        }

        const name =
          (
            (m.fullName as string) ||
            (m.FullName as string) ||
            (m.userName as string) ||
            (m.UserName as string) ||
            `${(m.firstName as string) ?? (m.FirstName as string) ?? ''} ${(m.lastName as string) ?? (m.LastName as string) ?? ''}`.trim()
          ).trim() ||
          email ||
          `Member #${finalId}`

        return {
          userId: finalId as number,
          firstName: name,
          lastName: '',
          email,
          role:
            (m.role as string) ||
            (m.Role as string) ||
            (m.designation as string) ||
            (m.Designation as string) ||
            'Member',
          designation: (m.designation as string) || (m.Designation as string) || '',
          department: (m.department as string) || (m.Department as string) || '',
        }
      }

      function processMembers(rawList: Array<Record<string, unknown>>): ProjectMember[] {
        const mapped = rawList.map(mapMember)
        const unique: ProjectMember[] = []
        const seen = new Set<string>()
        for (const item of mapped) {
          const key = String(item.userId || item.email)
          // User cannot allot ticket to themselves
          if (user && (Number(item.userId) === Number(user.userId) || (item.email && item.email.toLowerCase() === user.email.toLowerCase()))) {
            continue
          }
          if (!seen.has(key)) {
            seen.add(key)
            unique.push(item)
          }
        }
        return unique
      }

      // 1. PRIMARY: assignable/members — excludes the logged-in user automatically
      try {
        const res = await api.get(`/projects/${projectId}/members/assignable/members`)
        const data = res?.data
        const list = (data?.success && data?.data) ? data.data : (Array.isArray(data) ? data : data?.members || data?.data || [])
        if (Array.isArray(list) && list.length > 0) {
          setMembers(processMembers(list))
          setMembersLoading(false)
          return
        }
      } catch (err) {
        console.warn('Assignable members failed, trying fallback', err)
      }

      // 2. FALLBACK: general /members endpoint (excludes logged-in user)
      try {
        const res = await api.get(`/projects/${projectId}/members`)
        const data = res?.data
        const raw = (data?.success && data?.data) ? data.data : (Array.isArray(data) ? data : data?.members || data?.data || [])
        if (Array.isArray(raw) && raw.length > 0) {
          setMembers(processMembers(raw))
          setMembersLoading(false)
          return
        }
      } catch {
        // try fallbacks
      }

      // 3. FALLBACK: /Projects/{projectId}/members
      try {
        const res = await api.get(`/Projects/${projectId}/members`)
        const data = res?.data
        const raw = (data?.success && data?.data) ? data.data : (Array.isArray(data) ? data : data?.members || data?.data || [])
        if (Array.isArray(raw) && raw.length > 0) {
          setMembers(processMembers(raw))
          setMembersLoading(false)
          return
        }
      } catch {
        // try fallbacks
      }

      // 4. FALLBACK: /Projects/{id} project details
      try {
        const res = await api.get(`/Projects/${projectId}`)
        const data = res?.data
        const p = (data?.success && data?.data) ? data.data : data
        const pMembers = p?.members || p?.teamMembers || p?.projectMembers || []
        if (Array.isArray(pMembers) && pMembers.length > 0) {
          setMembers(processMembers(pMembers))
          setMembersLoading(false)
          return
        }
      } catch {
        // ignore
      }

      setMembers([])
      setMembersLoading(false)
    }

    loadMembers()
  }, [projectId, user])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // ── Validation ────────────────────────────────────────────────────────────
    if (!title.trim()) {
      toast('error', 'Title is required')
      return
    }
    if (!description.trim()) {
      toast('error', 'Description is required')
      return
    }
    if (!dueDate) {
      toast('error', 'Due Date is required')
      return
    }
    if (!projectId) {
      toast('error', 'Please select a project')
      return
    }
    if (!assignedToUserId) {
      toast('error', 'Please assign this ticket to a team member')
      return
    }
    if (!estimatedHours) {
      toast('error', 'Estimated Hours is required')
      return
    }
    // ─────────────────────────────────────────────────────────────────────────

    setLoading(true)

    let finalAssignedId: number | null = null
    if (assignedToUserId) {
      const num = Number(assignedToUserId)
      if (!isNaN(num) && num > 0) {
        finalAssignedId = num
      } else {
        const found = members.find(
          (m) => String(m.userId) === String(assignedToUserId) || m.email === assignedToUserId,
        )
        const foundNum = found ? Number(found.userId) : NaN
        if (!isNaN(foundNum) && foundNum > 0) {
          finalAssignedId = foundNum
        }
      }
    }

    if (user && finalAssignedId && Number(finalAssignedId) === Number(user.userId)) {
      toast('error', 'You cannot assign a ticket to yourself')
      setLoading(false)
      return
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      projectId: Number(projectId),
      assignedToUserId: finalAssignedId,
    }

    if (priority) payload.priority = priority
    if (category) payload.category = category
    if (userStoryId) payload.userStoryId = userStoryId.trim()
    if (sprintPhase) payload.sprintPhase = sprintPhase.trim()
    if (tags) payload.tags = tags.trim()
    if (estimatedHours) payload.estimatedHours = Number(estimatedHours)

    try {
      let res
      try {
        res = await api.post('/tickets', payload)
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 405) {
          res = await api.post('/Tickets', payload)
        } else {
          throw e
        }
      }
      const resData = res?.data?.success && res?.data?.data ? res.data.data : res?.data
      toast('success', 'Ticket created successfully!')
      if (resData && (resData as { id?: number }).id) {
        navigate(`/app/tickets/${(resData as { id: number }).id}`)
      } else {
        navigate('/app/tickets')
      }
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: unknown } })?.response?.data
      let msg = ''
      if (typeof resData === 'string') {
        msg = resData
      } else if (resData && typeof resData === 'object') {
        const d = resData as Record<string, unknown>
        msg = ((d.message as string) || (d.Message as string) || '').trim()
        if (!msg && d.errors && typeof d.errors === 'object') {
          msg = Object.values(d.errors).flat().join(' | ')
        }
        if (!msg && d.title) {
          msg = d.title as string
        }
      }
      toast('error', msg || 'Failed to create ticket')
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

        {/* Assignee — z-50, uses div NOT FormField(label) to avoid double-click on button */}
        <div className="relative z-50 flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-paper-muted">
            Assign To <span className="text-red-400">*</span>
          </span>
          <SearchableSelect
            options={members.map((m) => ({
              id: m.userId,
              label: m.firstName || m.email,
              sublabel: m.email,
              badge: m.role || m.department,
            }))}
            value={assignedToUserId}
            onChange={(val) => setAssignedToUserId(val)}
            placeholder={
              !projectId
                ? 'Select a project first'
                : membersLoading
                ? 'Loading project members...'
                : members.length === 0
                ? 'No members in this project yet'
                : 'Select a team member...'
            }
            searchPlaceholder="Type member name..."
            disabled={!projectId || membersLoading}
          />
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
          <FormField label="Estimated Hours (Optional)">
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
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.15em] text-paper-muted">
        {label}
      </span>
      {children}
    </div>
  )
}
