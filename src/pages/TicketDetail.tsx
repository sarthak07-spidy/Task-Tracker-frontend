import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  Layers,
  Trash2,
  Edit3,
  Send,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import type {
  ApiResponse,
  Ticket,
  CommentThread as CommentThreadType,
  AddCommentPayload,
  UpdateTicketPayload,
} from '../lib/types'
import {
  statusMapping,
  TicketStatusLabel,
  TicketStatusKey,
  TicketStatusColor,
  TicketStatusBg,
  PriorityLabel,
  PriorityColor,
  CategoryLabel,
  CategoryColor,
} from '../lib/constants'
import Badge from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import StatusDropdown from '../components/tickets/StatusDropdown'
import TimeLogger from '../components/tickets/TimeLogger'
import CommentThread from '../components/tickets/CommentThread'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'

const ease = [0.22, 1, 0.36, 1] as const

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [project, setProject] = useState<{ id: number; name: string } | null>(null)
  const [comments, setComments] = useState<CommentThreadType | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  // Edit form state — all API-supported fields
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState<string>('Open')
  const [editPriority, setEditPriority] = useState<number>(2)
  const [editCategory, setEditCategory] = useState<number>(0)
  const [editDueDate, setEditDueDate] = useState('')
  const [editEstHours, setEditEstHours] = useState<string>('')
  const [editSprint, setEditSprint] = useState('')
  const [editStory, setEditStory] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const isCreator = ticket && user && ticket.createdByUserId === user.userId
  const isAssigned = ticket && user && ticket.assignedToUserId === user.userId
  const isManager =
    user?.role === 'Manager' ||
    user?.role === 'SuperAdmin' ||
    user?.role === 'TeamLead'
  const canEdit = isCreator || isAssigned || isManager
  const canDelete = isCreator || user?.role === 'SuperAdmin'
  const canMarkForReview = isAssigned || isManager
  const canApprove = isManager && ticket?.status === 3

  const fetchTicket = useCallback(async () => {
    if (!id) return
    setLoading(true)
    let loadedTicket: Ticket | null = null

    try {
      const { data } = await api.get(`/tickets/${id}`)
      const resData = (data?.success && data?.data) ? data.data : data
      if (resData && (resData.id !== undefined || resData.title)) {
        loadedTicket = resData as Ticket
      }
    } catch {
      // Resilient fallback: look up ticket by ID from /tickets list
      try {
        const { data } = await api.get('/tickets', { params: { pageSize: 100 } })
        const list = (data?.success && data?.data) ? data.data : data
        const arr: Ticket[] = Array.isArray(list) ? list : (list?.tickets ?? [])
        const found = arr.find((t) => String(t.id) === String(id))
        if (found) {
          loadedTicket = found
        }
      } catch {
        // ignore fallback error
      }
    }

    if (loadedTicket) {
      setTicket(loadedTicket)
      if (loadedTicket.projectId) {
        api
          .get(`/Projects/${loadedTicket.projectId}`)
          .then(({ data }) => {
            const p = (data?.success && data?.data) ? data.data : data
            if (p?.name) setProject({ id: loadedTicket!.projectId!, name: p.name })
          })
          .catch(() => {
            api
              .get('/projects/all', { params: { pageSize: 100 } })
              .then(({ data }) => {
                const d = (data?.success && data?.data) ? data.data : data
                const arr = Array.isArray(d) ? d : (d?.projects ?? [])
                const found = arr.find((pr: { id: number; name: string }) => pr.id === loadedTicket?.projectId)
                if (found) setProject({ id: found.id, name: found.name })
              })
              .catch(() => {})
          })
      }
    } else {
      setTicket(null)
      toast('error', 'Failed to load ticket')
    }

    // Fetch comments independently so missing comments never break the ticket view
    try {
      const { data } = await api.get(`/tickets/${id}/comments-thread`)
      const cData = (data?.success && data?.data) ? data.data : data
      if (cData) {
        setComments(cData as CommentThreadType)
      }
    } catch {
      // Comments may be empty or not created yet
      setComments(null)
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  async function handleStatusChange(status: string) {
    setStatusLoading(true)
    try {
      try {
        await api.put(`/tickets/${id}/status`, { status })
      } catch (e: unknown) {
        const errObj = e as { response?: { status?: number } }
        if (errObj.response?.status === 404 || errObj.response?.status === 405) {
          await api.put(`/Tickets/${id}/status`, { status })
        } else {
          throw e
        }
      }
      toast('success', 'Status updated')
      fetchTicket()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to update status',
      )
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleTimeLog(hours: number) {
    try {
      try {
        await api.put(`/tickets/${id}/log-time`, { actualHours: hours })
      } catch (e: unknown) {
        const errObj = e as { response?: { status?: number } }
        if (errObj.response?.status === 404 || errObj.response?.status === 405) {
          await api.put(`/Tickets/${id}/log-time`, { actualHours: hours })
        } else {
          throw e
        }
      }
      toast('success', 'Time logged')
      fetchTicket()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to log time',
      )
    }
  }

  async function handleMarkForReview() {
    try {
      await api.post(`/tickets/${id}/mark-for-review`)
      toast('success', 'Ticket marked for review')
      fetchTicket()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to mark for review',
      )
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await api.delete(`/tickets/${id}`)
      toast('success', 'Ticket deleted')
      navigate('/app/tickets')
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to delete ticket',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleAddComment(payload: AddCommentPayload) {
    await api.post(`/tickets/${id}/comments`, payload)
    toast('success', 'Comment added')
    // Refresh comments
    const { data } = await api.get<ApiResponse<CommentThreadType>>(
      `/tickets/${id}/comments-thread`,
    )
    if (data.success) setComments(data.data)
  }

  function openEdit() {
    if (!ticket) return
    setEditTitle(ticket.title)
    setEditDesc(ticket.description)
    setEditStatus(ticket.status != null ? String(ticket.status) : 'Open')
    setEditPriority(ticket.priority)
    setEditCategory(ticket.category)
    setEditDueDate(ticket.dueDate ? ticket.dueDate.slice(0, 10) : '')
    setEditEstHours(ticket.estimatedHours != null ? String(ticket.estimatedHours) : '')
    setEditSprint(ticket.sprintPhase ?? '')
    setEditStory(ticket.userStoryId ?? '')
    setEditTags(ticket.tags ?? '')
    setEditOpen(true)
  }

  async function submitEdit() {
    setEditLoading(true)
    try {
      const payload: UpdateTicketPayload = {
        title: editTitle,
        description: editDesc,
        status: editStatus,
        priority: String(editPriority),
        category: String(editCategory),
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : ticket!.dueDate,
        sprintPhase: editSprint || undefined,
        userStoryId: editStory || undefined,
        tags: editTags || undefined,
        estimatedHours: editEstHours !== '' ? Number(editEstHours) : undefined,
      }

      await api.put(`/tickets/${id}`, payload)
      toast('success', 'Ticket updated')
      setEditOpen(false)
      fetchTicket()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to update',
      )
    } finally {
      setEditLoading(false)
    }
  }

  if (loading) return <PageLoader />
  if (!ticket) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="size-12 text-paper-muted" />
        <p className="text-lg font-semibold text-paper">Ticket not found</p>
        <Link
          to={project?.id ? `/app/tickets?projectId=${project.id}` : '/app/tickets'}
          className="text-sm text-brand hover:underline"
        >
          ← Back to tickets
        </Link>
      </div>
    )
  }

  const backUrl = ticket.projectId
    ? `/app/tickets?projectId=${ticket.projectId}`
    : project?.id
    ? `/app/tickets?projectId=${project.id}`
    : '/app/tickets'

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to={backUrl}
        className="inline-flex items-center gap-2 text-sm font-medium text-paper-muted transition-colors hover:text-paper"
      >
        <ArrowLeft className="size-4" />
        Back to tickets
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="space-y-6"
        >
          {/* Title & actions */}
          <div className="rounded-2xl border border-line bg-ink-soft p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl font-bold text-paper">
                    {ticket.title}
                  </h1>
                  <span className="text-sm text-paper-muted">#{ticket.id}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    label={TicketStatusLabel[ticket.status] ?? 'Open'}
                    color={TicketStatusColor[ticket.status] ?? '#3b82f6'}
                    bg={TicketStatusBg[ticket.status]}
                    dot
                    size="md"
                  />
                  <Badge
                    label={PriorityLabel[ticket.priority] ?? 'Medium'}
                    color={PriorityColor[ticket.priority] ?? '#f59e0b'}
                    size="md"
                  />
                  {ticket.category > 0 && (
                    <Badge
                      label={CategoryLabel[ticket.category] ?? ''}
                      color={CategoryColor[ticket.category] ?? '#6b7280'}
                      size="md"
                    />
                  )}
                  {ticket.approvalStatus &&
                    ticket.approvalStatus !== 'None' && (
                      <Badge
                        label={ticket.approvalStatus}
                        color={
                          ticket.approvalStatus === 'Approved'
                            ? '#22c55e'
                            : ticket.approvalStatus === 'Pending'
                              ? '#a855f7'
                              : '#ef4444'
                        }
                        size="md"
                      />
                    )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    <StatusDropdown
                      currentStatus={ticket.status}
                      onStatusChange={handleStatusChange}
                      disabled={statusLoading}
                    />
                    <button
                      type="button"
                      onClick={openEdit}
                      className="rounded-xl border border-line p-2.5 text-paper-muted transition-colors hover:bg-line hover:text-paper"
                      title="Edit"
                    >
                      <Edit3 className="size-4" />
                    </button>
                  </>
                )}
                {canMarkForReview && ticket.status === 2 && (
                  <button
                    type="button"
                    onClick={handleMarkForReview}
                    className="rounded-xl bg-purple-500/15 px-3 py-2.5 text-xs font-semibold text-purple-400 transition-colors hover:bg-purple-500/25"
                  >
                    <Send className="size-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="rounded-xl border border-red-500/30 p-2.5 text-red-400 transition-colors hover:bg-red-500/15"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-paper-muted">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper/90">
                {ticket.description}
              </p>
            </div>

            {/* Time logging */}
            {canEdit && (
              <div className="mt-5 border-t border-line pt-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-paper-muted">
                  Log Time
                </h3>
                <TimeLogger
                  currentHours={ticket.actualHours ?? null}
                  onLog={handleTimeLog}
                />
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-2xl border border-line bg-ink-soft p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-paper">
              Comments ({comments?.totalComments ?? 0})
            </h2>
            <CommentThread
              comments={comments?.comments ?? []}
              onAddComment={handleAddComment}
            />
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="space-y-4"
        >
          {/* Details card */}
          <div className="rounded-2xl border border-line bg-ink-soft p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-paper-muted">
              Details
            </h3>
            <div className="flex flex-col gap-4">
              {(project || ticket.projectId) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-paper-muted">
                    <FolderKanban className="size-3 text-brand" />
                    Project
                  </span>
                  <Link
                    to={`/app/tickets?projectId=${ticket.projectId}`}
                    className="font-semibold text-brand hover:underline flex items-center gap-1 max-w-[150px] truncate"
                    title={project?.name || `Project #${ticket.projectId}`}
                  >
                    {project?.name || `Project #${ticket.projectId}`}
                  </Link>
                </div>
              )}
              <DetailRow
                icon={User}
                label="Created by"
                value={ticket.createdByName}
              />
              <DetailRow
                icon={User}
                label="Assigned to"
                value={ticket.assignedToName ?? 'Unassigned'}
              />
              <DetailRow
                icon={Calendar}
                label="Due date"
                value={new Date(ticket.dueDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                warn={
                  new Date(ticket.dueDate) < new Date() &&
                  ticket.status !== 'Completed' &&
                  ticket.status !== 'Closed' &&
                  Number(ticket.status) !== 4 &&
                  Number(ticket.status) !== 5
                }
              />
              <DetailRow
                icon={Clock}
                label="Estimated"
                value={`${ticket.estimatedHours ?? 0} hours`}
              />
              <DetailRow
                icon={Clock}
                label="Actual"
                value={`${ticket.actualHours ?? 0} hours`}
              />
              {ticket.userStoryId && (
                <DetailRow
                  icon={Layers}
                  label="User Story"
                  value={ticket.userStoryId}
                />
              )}
              {ticket.sprintPhase && (
                <DetailRow
                  icon={Layers}
                  label="Sprint"
                  value={ticket.sprintPhase}
                />
              )}
              {ticket.tags && (
                <div>
                  <span className="flex items-center gap-2 text-xs text-paper-muted">
                    <Tag className="size-3" />
                    Tags
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ticket.tags.split(',').map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-line px-2 py-0.5 text-[11px] font-medium text-paper-muted"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-2xl border border-line bg-ink-soft p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-paper-muted">
              Timeline
            </h3>
            <div className="flex flex-col gap-2 text-xs text-paper-muted">
              <span>
                Created:{' '}
                {new Date(ticket.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>
                Updated:{' '}
                {new Date(ticket.updatedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {ticket.completedAt && (
                <span className="text-green-400">
                  Completed:{' '}
                  {new Date(ticket.completedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Approval for managers */}
          {canApprove && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-400">
                <CheckCircle2 className="size-4" />
                Review Required
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await api.put(`/tickets/${id}/approve-completion`, {
                      approvalRemark: 'Approved',
                    })
                    toast('success', 'Approved!')
                    fetchTicket()
                  }}
                  className="flex-1 rounded-xl bg-green-600 py-2 text-xs font-semibold text-paper hover:bg-green-500"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const reason = prompt('Rejection reason:')
                    if (!reason) return
                    await api.put(`/tickets/${id}/reject-completion`, {
                      rejectionReason: reason,
                    })
                    toast('info', 'Ticket rejected')
                    fetchTicket()
                  }}
                  className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-paper hover:bg-red-500"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        description={`Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
      />

      {/* Edit modal — full field coverage */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Ticket"
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col gap-4">

          {/* Title */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Title</span>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
            />
          </label>

          {/* Description */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Description</span>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              style={{ overflow: 'hidden', resize: 'none' }}
              className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${el.scrollHeight}px`
              }}
            />
          </label>

          {/* Status / Priority / Category */}
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Status</span>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="rounded-xl border border-line bg-ink/60 px-3 py-3 text-sm text-paper outline-none focus:border-brand"
              >
                {Object.entries(statusMapping).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Priority</span>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(Number(e.target.value))}
                className="rounded-xl border border-line bg-ink/60 px-3 py-3 text-sm text-paper outline-none focus:border-brand"
              >
                {Object.entries(PriorityLabel).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Category</span>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(Number(e.target.value))}
                className="rounded-xl border border-line bg-ink/60 px-3 py-3 text-sm text-paper outline-none focus:border-brand"
              >
                <option value={0}>— None —</option>
                {Object.entries(CategoryLabel).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Due Date & Estimated Hours */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Due Date</span>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Estimated Hours</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={editEstHours}
                onChange={(e) => setEditEstHours(e.target.value)}
                placeholder="0"
                className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
              />
            </label>
          </div>

          {/* Sprint / User Story */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Sprint</span>
              <input
                value={editSprint}
                onChange={(e) => setEditSprint(e.target.value)}
                placeholder="e.g. Phase-1"
                className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">User Story</span>
              <input
                value={editStory}
                onChange={(e) => setEditStory(e.target.value)}
                placeholder="e.g. US-001"
                className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
              />
            </label>
          </div>

          {/* Tags */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">Tags (comma-separated)</span>
            <input
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="e.g. bug, critical, frontend"
              className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none focus:border-brand"
            />
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-paper-muted hover:bg-line"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitEdit}
              disabled={editLoading}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-50"
            >
              {editLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  warn = false,
}: {
  icon: typeof User
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div>
      <span className="flex items-center gap-2 text-xs text-paper-muted">
        <Icon className="size-3" />
        {label}
      </span>
      <span
        className={`mt-0.5 block text-sm font-medium ${
          warn ? 'text-red-400' : 'text-paper'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
