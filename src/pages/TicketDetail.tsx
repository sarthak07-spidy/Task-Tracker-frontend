import { useEffect, useState, useCallback, useMemo } from 'react'
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
  XCircle,
  AlertCircle,
  FolderKanban,
  Mail,
  Lock,
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
import Spinner, { PageLoader } from '../components/ui/Spinner'
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

  // Complete ticket with review modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [completeLoading, setCompleteLoading] = useState(false)

  // Reject assignment modal state (only for assignee while ticket is Open)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)

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

  // Directory map to look up emails by userId and name
  const [userEmailMap, setUserEmailMap] = useState<Map<string | number, string>>(new Map())

  useEffect(() => {
    async function loadDirectory() {
      try {
        let empList: Array<Record<string, unknown>> = []
        try {
          const res = await api.get('/Users/employees')
          const d = res.data?.success ? res.data.data : res.data
          if (Array.isArray(d)) empList = d
        } catch {
          try {
            const res2 = await api.get('/SuperAdmin/users')
            const d2 = res2.data?.success ? res2.data.data : res2.data
            if (Array.isArray(d2)) empList = d2
          } catch {}
        }

        const map = new Map<string | number, string>()
        empList.forEach((e) => {
          const email = ((e.email as string) || (e.Email as string) || '').trim()
          if (!email) return
          const uid = Number(e.id ?? e.userId ?? e.Id ?? e.UserId)
          if (!isNaN(uid) && uid > 0) {
            map.set(uid, email)
            map.set(String(uid), email)
          }
          const fullName = (
            (e.fullName as string) ||
            `${(e.firstName as string) ?? ''} ${(e.lastName as string) ?? ''}`
          ).trim().toLowerCase()
          if (fullName) {
            map.set(fullName, email)
          }
        })
        setUserEmailMap(map)
      } catch {
        // ignore directory load failure
      }
    }
    loadDirectory()
  }, [])

  function resolveEmail(
    userId?: number | null,
    name?: string | null,
    directEmail?: string | null,
  ): string | null {
    if (directEmail && directEmail.includes('@')) {
      return directEmail.trim()
    }
    if (userId != null && userEmailMap.has(userId)) {
      return userEmailMap.get(userId) ?? null
    }
    if (userId != null && userEmailMap.has(String(userId))) {
      return userEmailMap.get(String(userId)) ?? null
    }
    if (name && userEmailMap.has(name.trim().toLowerCase())) {
      return userEmailMap.get(name.trim().toLowerCase()) ?? null
    }
    if (user && user.email) {
      if (
        (userId != null && Number(user.userId) === Number(userId)) ||
        (name && `${user.firstName} ${user.lastName}`.trim().toLowerCase() === name.trim().toLowerCase())
      ) {
        return user.email
      }
    }
    return null
  }

  const createdEmail = resolveEmail(
    ticket?.createdByUserId,
    ticket?.createdByName,
    ticket?.createdByEmail,
  )

  const assignedEmail = resolveEmail(
    ticket?.assignedToUserId,
    ticket?.assignedToName,
    ticket?.assignedToEmail,
  )

  const isCreator = Boolean(
    ticket &&
      user &&
      (
        (ticket.createdByUserId != null &&
          Number(ticket.createdByUserId) > 0 &&
          Number(user.userId) > 0 &&
          Number(ticket.createdByUserId) === Number(user.userId)) ||
        (createdEmail &&
          user.email &&
          createdEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      )
  )

  const isAssigned = Boolean(
    ticket &&
      user &&
      (
        (ticket.assignedToUserId != null &&
          Number(ticket.assignedToUserId) > 0 &&
          Number(user.userId) > 0 &&
          Number(ticket.assignedToUserId) === Number(user.userId)) ||
        (assignedEmail &&
          user.email &&
          assignedEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (ticket.assignedToEmail &&
          user.email &&
          ticket.assignedToEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (ticket.assignedToName &&
          user &&
          (
            `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase() === ticket.assignedToName.trim().toLowerCase() ||
            (user.firstName && ticket.assignedToName.toLowerCase().includes(user.firstName.toLowerCase().trim())) ||
            (user.email && ticket.assignedToName.toLowerCase().includes(user.email.split('@')[0].split('.')[0].toLowerCase()))
          )) ||
        (!isCreator && Boolean(ticket.assignedToName || ticket.assignedToUserId))
      )
  )

  // Only the person who assigned the ticket can complete it
  const isAssigner = Boolean(
    ticket &&
      user &&
      (
        isCreator ||
        (ticket.assignedByUserId != null &&
          Number(ticket.assignedByUserId) > 0 &&
          Number(user.userId) > 0 &&
          Number(ticket.assignedByUserId) === Number(user.userId) &&
          Number(ticket.assignedByUserId) !== Number(ticket.assignedToUserId))
      )
  )

  // Ticket can ONLY be completed when status is "In Review"
  const isInReview = Boolean(
    ticket &&
      (ticket.status === 'InReview' ||
        ticket.status === 'In Review' ||
        ticket.status === 3 ||
        String(ticket.status).toLowerCase().replace(/\s+/g, '') === 'inreview' ||
        String(ticket.status) === '3')
  )

  const isInProgress = Boolean(
    ticket &&
      (ticket.status === 'InProgress' ||
        ticket.status === 'In Progress' ||
        ticket.status === 2 ||
        String(ticket.status).toLowerCase().replace(/\s+/g, '') === 'inprogress' ||
        String(ticket.status) === '2')
  )

  // Ticket status is Open
  const isOpen = Boolean(
    ticket &&
      (ticket.status === 'Open' ||
        ticket.status === 1 ||
        String(ticket.status).toLowerCase() === 'open' ||
        String(ticket.status) === '1' ||
        TicketStatusLabel[ticket.status] === 'Open')
  )

  // Ticket is fully finalized — no edits, no new comments, no status changes allowed
  const isClosed = Boolean(
    ticket &&
      (ticket.status === 'Closed' ||
        ticket.status === 'Close' ||
        ticket.status === 5 ||
        String(ticket.status).toLowerCase() === 'closed' ||
        String(ticket.status).toLowerCase() === 'close' ||
        String(ticket.status) === '5')
  )

  const isRejected = Boolean(
    ticket &&
      (ticket.status === 'Rejected' ||
        ticket.status === 'Reject' ||
        ticket.status === 6 ||
        String(ticket.status).toLowerCase() === 'rejected' ||
        String(ticket.status).toLowerCase() === 'reject' ||
        String(ticket.status) === '6')
  )

  // Completion review details (from approvalRemark, ticket history, or comments thread)
  const completionReview = useMemo(() => {
    if (!ticket) return null

    // 1. Direct fields on ticket
    const direct =
      ticket.approvalRemark ||
      (ticket as { ApprovalRemark?: string }).ApprovalRemark ||
      (ticket as { completionRemark?: string }).completionRemark

    if (direct && typeof direct === 'string' && direct.trim()) {
      return {
        text: direct.trim(),
        by: ticket.createdByName || 'Assigner',
        at: ticket.completedAt || ticket.updatedAt,
      }
    }

    // 2. Ticket history (TicketHistoryResponse from backend)
    if (ticket.history && Array.isArray(ticket.history)) {
      const hMatch = ticket.history.slice().reverse().find(
        (h) =>
          (h.action?.toLowerCase().includes('complet') ||
            h.action?.toLowerCase().includes('approv') ||
            h.action?.toLowerCase().includes('close')) &&
          h.comment &&
          h.comment.trim()
      )
      if (hMatch && hMatch.comment) {
        return {
          text: hMatch.comment.trim(),
          by: hMatch.performedByName || ticket.createdByName || 'Assigner',
          at: hMatch.performedAt || ticket.completedAt || ticket.updatedAt,
        }
      }
    }

    // 3. Comments thread (Completion Review comment)
    if (comments?.comments && Array.isArray(comments.comments)) {
      const cMatch = comments.comments.slice().reverse().find(
        (c) =>
          c.content?.includes('Completion Review') ||
          c.content?.includes('Review') ||
          c.content?.startsWith('📋')
      )
      if (cMatch?.content) {
        const clean = cMatch.content.replace(/^[📋\s]*\**Completion Review\**:\s*/i, '').trim()
        if (clean) {
          return {
            text: clean,
            by: cMatch.userName || ticket.createdByName || 'Assigner',
            at: cMatch.createdAt,
          }
        }
      }
    }

    return null
  }, [ticket, comments])

  // Official completion: ONLY true when ticket was officially reviewed & completed by the assigner.
  // Mere status update to "Completed" does NOT lock/archive the ticket.
  const isOfficiallyCompleted = Boolean(
    ticket &&
      (localStorage.getItem(`ticket_${ticket.id}_officially_completed`) === 'true' ||
        ticket.approvalStatus === 'Approved' ||
        (ticket.approvalRemark && ticket.approvalRemark.trim().length > 0) ||
        (completionReview &&
          completionReview.text &&
          ticket.history?.some(
            (h) =>
              h.action?.toLowerCase().includes('complet') ||
              h.action?.toLowerCase().includes('approv'),
          )))
  )

  // Finalized tickets (read-only): ONLY if rejected OR officially completed with review.
  // Regular status "Completed" from dropdown does NOT finalize the ticket — it remains normally editable.
  const isFinalized = isRejected || isOfficiallyCompleted

  const isStatusCompleted = Boolean(
    ticket &&
      (ticket.status === 'Completed' ||
        ticket.status === 'Closed' ||
        ticket.status === 'Close' ||
        ticket.status === 4 ||
        ticket.status === 5 ||
        String(ticket.status).toLowerCase() === 'completed' ||
        String(ticket.status).toLowerCase() === 'closed')
  )

  // Complete button is strictly visible ONLY to the assigner, when status is In Review OR Completed,
  // and the ticket is not yet officially completed
  const canComplete =
    (isInReview || isStatusCompleted) && isAssigner && !isOfficiallyCompleted

  // Reject button: ONLY visible when ticket was NEVER status-changed before.
  // ticket.history tracks all status changes. If ANY entry exists or status changed once → Reject is permanently gone.
  // This means: created as Open → Reject shows. Status changed even once → Reject gone forever.
  const localStatusChanged = ticket
    ? localStorage.getItem(`ticket_${ticket.id}_has_status_change`) === 'true'
    : false
  const statusNeverChanged =
    (!ticket?.history || ticket.history.length === 0) && !localStatusChanged
  const canRejectAssignment = Boolean(
    !isFinalized && isAssigned && isOpen && statusNeverChanged
  )

  const isManager =
    user?.role === 'Manager' ||
    user?.role === 'SuperAdmin' ||
    user?.role === 'TeamLead'
  // canEdit is blocked ONLY when ticket is finalized (rejected or officially reviewed)
  const canEdit = !isFinalized && (isCreator || isAssigned || isManager)
  const canDelete = !isFinalized && isCreator
  const canMarkForReview = !isFinalized && (isAssigned || isManager)
  const canApprove = isManager && isInReview

  // Rejection reason details (if rejected)
  const rejectionDetail = useMemo(() => {
    if (!ticket || !isRejected) return null
    const direct =
      ticket.rejectionReason ||
      (ticket as { RejectionReason?: string }).RejectionReason
    if (direct && typeof direct === 'string' && direct.trim()) {
      return {
        text: direct.trim(),
        by: ticket.assignedToName || 'Assignee',
      }
    }
    if (comments?.comments && Array.isArray(comments.comments)) {
      const cMatch = comments.comments.slice().reverse().find(
        (c) =>
          c.content?.includes('Assignment Rejected') ||
          c.content?.includes('Changes Requested') ||
          c.content?.startsWith('❌') ||
          c.content?.startsWith('⚠️')
      )
      if (cMatch?.content) {
        const clean = cMatch.content.replace(/^[❌⚠️\s]*\**[^*]+\**:\s*/i, '').trim()
        if (clean) {
          return {
            text: clean,
            by: cMatch.userName || ticket.assignedToName || 'Assignee',
          }
        }
      }
    }
    return null
  }, [ticket, isRejected, comments])

  const fetchTicket = useCallback(async (silent = false) => {
    if (!id) return
    if (!silent) setLoading(true)
    let loadedTicket: Ticket | null = null

    try {
      // 1. Try active ticket: GET /api/tickets/{id}
      const { data } = await api.get(`/tickets/${id}`)
      const resData = (data?.success && data?.data) ? data.data : data
      if (resData && (resData.id !== undefined || resData.title)) {
        loadedTicket = resData as Ticket
      }
    } catch {
      // 2. Try completed ticket: GET /api/tickets/completed/{id}
      try {
        const { data } = await api.get(`/tickets/completed/${id}`)
        const resData = (data?.success && data?.data) ? data.data : data
        if (resData && (resData.id !== undefined || resData.title)) {
          loadedTicket = { ...(resData as Ticket), status: resData.status || 'Closed' }
        }
      } catch {
        // 3. Try rejected ticket: GET /api/tickets/rejected/{id}
        try {
          const { data } = await api.get(`/tickets/rejected/${id}`)
          const resData = (data?.success && data?.data) ? data.data : data
          if (resData && (resData.id !== undefined || resData.title)) {
            loadedTicket = { ...(resData as Ticket), status: resData.status || 'Rejected' }
          }
        } catch {
          // Fallback: look up ticket by ID from /tickets list
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
    } else if (!silent) {
      setTicket(null)
      toast('error', 'Failed to load ticket')
    }

    // Fetch comments independently so missing comments never break the ticket view
    try {
      const { data } = await api.get(`/tickets/${id}/comments-thread`)
      const cData = (data?.success && data?.data) ? data.data : data
      if (cData) {
        const rawComments = Array.isArray(cData.comments) ? cData.comments : []
        const mappedComments = rawComments.map((c: Record<string, unknown>) => ({
          ...c,
          content: (c.content as string) || (c.message as string) || '',
          message: (c.message as string) || (c.content as string) || '',
        }))
        setComments({
          ticketId: Number(cData.ticketId ?? id),
          ticketTitle: (cData.ticketTitle as string) || '',
          totalComments: rawComments.length,
          comments: mappedComments,
        })
      }
    } catch {
      // Comments may be empty or not created yet
      if (!silent) setComments(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [id, toast])

  // Silent background refresh — used after actions (status change, complete, reject etc.)
  // so the screen doesn't flash a full-page loader
  const silentRefresh = useCallback(() => fetchTicket(true), [fetchTicket])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  async function handleStatusChange(status: string) {
    const isCompletedAttempt =
      status === 'Completed' ||
      status === '4' ||
      String(status).toLowerCase() === 'completed'

    if (isCompletedAttempt) {
      // Dropdown "Completed" = regular status change only (status becomes Closed/Completed).
      // Full official completion (with review) is done via the "Complete" button when InReview.
      // Map "Completed" → "Closed" for the backend status API.
      status = 'Closed'
    }

    const isRejectedAttempt =
      status === 'Rejected' ||
      status === 'Reject' ||
      status === '6' ||
      String(status).toLowerCase() === 'rejected'

    if (isRejectedAttempt) {
      if (isAssigner) {
        toast('error', 'The assigner cannot reject this ticket.')
        return
      }
      setRejectReason('')
      setRejectModalOpen(true)
      return
    }

    // Note: Completed/Closed status is allowed for everyone — assignee marks it to signal
    // "work done, ready for review". Official completion with review is via the Complete button.

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
      if (id) {
        localStorage.setItem(`ticket_${id}_has_status_change`, 'true')
        localStorage.removeItem(`ticket_${id}_officially_completed`)
      }
      silentRefresh()
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

  async function handleCompleteWithReview() {
    if (!ticket) return
    const review = reviewComment.trim()
    if (!review) {
      toast('error', 'Please enter your review before completing the ticket.')
      return
    }

    setCompleteLoading(true)
    try {
      // 1. Call PUT /api/Tickets/{id}/completed with ApprovalRemark (Swagger endpoint)
      try {
        await api.put(`/Tickets/${id}/completed`, {
          ApprovalRemark: review,
        })
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 405) {
          try {
            await api.put(`/tickets/${id}/completed`, {
              ApprovalRemark: review,
            })
          } catch {
            try {
              await api.put(`/tickets/${id}/complete`, {
                ApprovalRemark: review,
              })
            } catch {
              try {
                await api.put(`/tickets/${id}/status`, { status: 'Closed' })
              } catch {
                await api.put(`/Tickets/${id}/status`, { status: 'Closed' })
              }
            }
          }
        } else {
          throw e
        }
      }

      // 2. Also post review comment into thread for transparency
      try {
        await api.post(`/tickets/${id}/comments`, {
          message: `📋 **Completion Review**: ${review}`,
        })
      } catch {
        try {
          await api.post(`/tickets/${id}/comments`, {
            content: `📋 **Completion Review**: ${review}`,
          })
        } catch {}
      }

      toast('success', 'Ticket completed successfully!')
      setCompleteModalOpen(false)
      setReviewComment('')
      if (id) {
        localStorage.setItem(`ticket_${id}_officially_completed`, 'true')
      }
      silentRefresh()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to complete ticket',
      )
    } finally {
      setCompleteLoading(false)
    }
  }

  // Assignee rejects assignment
  async function handleRejectAssignment() {
    if (!ticket) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast('error', 'Please provide a reason for rejecting this assignment.')
      return
    }

    setRejectLoading(true)
    try {
      // Primary: PUT /api/tickets/{id}/reject with RejectionReason (documented contract)
      try {
        await api.put(`/tickets/${id}/reject`, {
          RejectionReason: reason,
        })
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 405 || status === 400) {
          try {
            await api.put(`/Tickets/${id}/reject`, {
              RejectionReason: reason,
            })
          } catch {
            try {
              await api.put(`/tickets/${id}/reject`, {
                rejectionReason: reason,
              })
            } catch {
              await api.put(`/Tickets/${id}/reject`, {
                rejectionReason: reason,
              })
            }
          }
        } else {
          throw e
        }
      }

      // Add chat thread entry for assignment rejection
      try {
        await api.post(`/tickets/${id}/comments`, {
          message: `❌ **Assignment Rejected**: ${reason}`,
        })
      } catch {
        try {
          await api.post(`/tickets/${id}/comments`, {
            content: `❌ **Assignment Rejected**: ${reason}`,
          })
        } catch {}
      }

      toast('info', 'Ticket assignment has been rejected.')
      setRejectModalOpen(false)
      setRejectReason('')
      silentRefresh()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to reject ticket assignment',
      )
    } finally {
      setRejectLoading(false)
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
      silentRefresh()
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
      silentRefresh()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to mark for review',
      )
    }
  }

  function handleDeleteClick() {
    if (!ticket) return

    const isOpenStatus =
      ticket.status === 'Open' ||
      ticket.status === 1 ||
      String(ticket.status).toLowerCase() === 'open' ||
      String(ticket.status) === '1'

    if (!isOpenStatus) {
      const currentLabel = TicketStatusLabel[ticket.status] || ticket.status
      toast(
        'error',
        `Ticket cannot be deleted because its status is not Open (Current status: ${currentLabel}).`,
      )
      return
    }

    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!ticket) return

    const isOpenStatus =
      ticket.status === 'Open' ||
      ticket.status === 1 ||
      String(ticket.status).toLowerCase() === 'open' ||
      String(ticket.status) === '1'

    if (!isOpenStatus) {
      const currentLabel = TicketStatusLabel[ticket.status] || ticket.status
      toast(
        'error',
        `Ticket cannot be deleted because its status is not Open (Current status: ${currentLabel}).`,
      )
      setDeleteOpen(false)
      return
    }

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

  async function handleAddComment(payload: { message?: string; content?: string }) {
    const text = (payload.message || payload.content || '').trim()
    if (!text) return

    try {
      await api.post(`/tickets/${id}/comments`, {
        message: text,
      })
    } catch {
      try {
        await api.post(`/tickets/${id}/comments`, {
          content: text,
        })
      } catch {
        await api.post(`/Tickets/${id}/comments`, {
          message: text,
        })
      }
    }
    toast('success', 'Message sent')

    // Refresh comments thread from GET /api/tickets/{id}/comments-thread
    try {
      const { data } = await api.get(`/tickets/${id}/comments-thread`)
      const cData = (data?.success && data?.data) ? data.data : data
      if (cData) {
        const rawComments = Array.isArray(cData.comments) ? cData.comments : []
        const mappedComments = rawComments.map((c: Record<string, unknown>) => ({
          ...c,
          content: (c.content as string) || (c.message as string) || '',
          message: (c.message as string) || (c.content as string) || '',
        }))
        setComments({
          ticketId: Number(cData.ticketId ?? id),
          ticketTitle: (cData.ticketTitle as string) || '',
          totalComments: rawComments.length,
          comments: mappedComments,
        })
      }
    } catch {}
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
      silentRefresh()
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
                      isInReview={isInReview}
                      isAssigned={isAssigned}
                      isAssigner={isAssigner}
                      canReject={canRejectAssignment}
                      onOpenRejectModal={() => {
                        setRejectReason('')
                        setRejectModalOpen(true)
                      }}
                    />
                    <button
                      type="button"
                      onClick={openEdit}
                      className="rounded-xl border border-line p-2.5 text-paper-muted transition-colors hover:bg-line hover:text-paper cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="size-4" />
                    </button>
                  </>
                )}
                {/* Complete Button: ONLY visible when status is In Review AND current user is the assigner */}
                {canComplete && (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewComment('')
                      setCompleteModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-paper shadow-lg shadow-emerald-950/40 transition-all hover:bg-emerald-500 cursor-pointer"
                    title="Complete ticket with review"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Complete</span>
                  </button>
                )}

                {/* Reject Button for Assignee: easily accessible right in the action bar */}
                {canRejectAssignment && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason('')
                      setRejectModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-400 shadow-sm transition-all hover:bg-red-500/20 cursor-pointer"
                    title="Reject ticket assignment"
                  >
                    <XCircle className="size-4" />
                    <span>Reject</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="rounded-xl border border-red-500/30 p-2.5 text-red-400 transition-colors hover:bg-red-500/15 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Finalized read-only banner — shown when ticket is Completed or Rejected */}
            {isFinalized && (
              <div className="mt-6 border-t border-line pt-5 flex flex-col gap-4">
                <div
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${
                    isRejected
                      ? 'border-red-500/30 bg-red-500/8'
                      : 'border-emerald-500/30 bg-emerald-500/8'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${
                      isRejected
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <Lock className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold ${
                        isRejected ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {isRejected ? 'Ticket Rejected' : 'Ticket Completed'}
                    </p>
                    <p className="mt-0.5 text-xs text-paper-muted leading-relaxed">
                      {isRejected
                        ? 'This ticket was rejected. It is archived and no further changes can be made.'
                        : 'This ticket has been completed. It is now read-only and archived.'}
                    </p>
                  </div>
                </div>

                {/* Prominent Completion Review Card */}
                {!isRejected && completionReview && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Completion Review
                        </span>
                      </div>
                      <span className="text-[11px] text-paper-muted">
                        Reviewed by <span className="font-semibold text-paper">{completionReview.by}</span>
                        {completionReview.at && ` • ${new Date(completionReview.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper italic">
                        "{completionReview.text}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Prominent Rejection Reason Card */}
                {isRejected && rejectionDetail && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                          <XCircle className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                          Reason for Rejection
                        </span>
                      </div>
                      <span className="text-[11px] text-paper-muted">
                        Rejected by <span className="font-semibold text-paper">{rejectionDetail.by}</span>
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper italic">
                        "{rejectionDetail.text}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-paper-muted">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper/90">
                {ticket.description}
              </p>
            </div>

            {/* Time logging — hidden when finalized, show read-only hours */}
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
            {isFinalized && (ticket.actualHours || ticket.estimatedHours) && (
              <div className="mt-5 border-t border-line pt-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-paper-muted">
                  Time Summary
                </h3>
                <div className="flex items-center gap-4 text-sm text-paper-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span className="text-paper font-semibold">{ticket.actualHours ?? 0}h</span>
                    <span>/ {ticket.estimatedHours ?? 0}h estimated</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Live Ticket Chat & Discussion */}
          <div className="mt-2">
            <CommentThread
              ticketId={Number(id)}
              comments={comments?.comments ?? []}
              onAddComment={handleAddComment}
              readOnly={isFinalized}
              onRealtimeMessage={(newMsg) => {
                setComments((prev) => {
                  const formatted = {
                    id: newMsg.id,
                    ticketId: newMsg.ticketId,
                    userName: newMsg.userName,
                    message: newMsg.message,
                    content: newMsg.message,
                    createdAt: newMsg.createdAt,
                  }
                  if (!prev) {
                    return {
                      ticketId: Number(id),
                      ticketTitle: ticket?.title || '',
                      totalComments: 1,
                      comments: [formatted],
                    }
                  }
                  const exists = prev.comments.some((c) => c.id === newMsg.id)
                  if (exists) return prev
                  return {
                    ...prev,
                    totalComments: (prev.totalComments || prev.comments.length) + 1,
                    comments: [...prev.comments, formatted],
                  }
                })
              }}
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
                email={createdEmail}
              />
              <DetailRow
                icon={User}
                label="Assigned to"
                value={ticket.assignedToName ?? 'Unassigned'}
                email={assignedEmail}
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

          {/* In Review status card */}
          {isInReview && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                  <CheckCircle2 className="size-4" />
                  In Review
                </h3>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                  Pending Completion
                </span>
              </div>
              <p className="mt-2 text-xs text-paper-muted leading-relaxed">
                {isAssigner
                  ? 'You assigned this ticket. Please review the deliverables and complete the ticket with your review.'
                  : `Waiting for ${ticket.createdByName || 'the assigner'}${createdEmail ? ` (${createdEmail})` : ''} to review and complete this ticket.`}
              </p>

              {/* Complete button is strictly visible ONLY to the assigner */}
              {canComplete && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewComment('')
                      setCompleteModalOpen(true)
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-paper shadow-lg shadow-emerald-950/40 transition-all hover:bg-emerald-500 cursor-pointer"
                  >
                    <CheckCircle2 className="size-4" />
                    Complete Ticket
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Assignee Rejection Card */}
          {canRejectAssignment && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400">
                  <XCircle className="size-4" />
                  Reject Assignment
                </h3>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                  Assignee Action
                </span>
              </div>
              <p className="mt-2 text-xs text-paper-muted leading-relaxed">
                You can reject this assignment if you are unable to work on this ticket.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRejectReason('')
                    setRejectModalOpen(true)
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 cursor-pointer"
                >
                  <XCircle className="size-4" />
                  Reject Assignment
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
        hideScrollbar={true}
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
                {Object.entries(statusMapping).map(([val, label]) => {
                  const isCompleted = val.toLowerCase() === 'completed'
                  const isClosed = val.toLowerCase() === 'closed' || val.toLowerCase() === 'close'
                  const isRejected = val.toLowerCase() === 'rejected' || val.toLowerCase() === 'reject'

                  // Rule 1: Close option usee nahi dikhega jisko assign hui hai
                  if (isClosed && isAssigned && !isAssigner) {
                    return null
                  }

                  // Rule 2: Reject option usee nahi dikhega jisne assign kari hai
                  if (isRejected && isAssigner) {
                    return null
                  }

                  if (isCompleted && String(ticket?.status).toLowerCase() !== 'completed') {
                    return null
                  }
                  return (
                    <option key={val} value={val}>{label}</option>
                  )
                })}
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

      {/* Complete Ticket & Add Review Modal */}
      <Modal
        open={completeModalOpen}
        onClose={() => {
          if (!completeLoading) setCompleteModalOpen(false)
        }}
        title="Complete Ticket & Add Review"
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-ink/40 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-paper-muted">Ticket #{ticket.id}</span>
              <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 font-semibold text-purple-300">
                In Review
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-paper">
              {ticket.title}
            </p>
            {ticket.assignedToName && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-paper-muted">
                <span>Assigned to:</span>
                <span className="font-medium text-paper">
                  {ticket.assignedToName}
                </span>
                {assignedEmail && (
                  <span className="font-mono text-[11px] text-paper-muted/80">
                    ({assignedEmail})
                  </span>
                )}
              </p>
            )}
          </div>

          <label htmlFor="complete-review-textarea" className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-paper-muted">
              <span>Review & Feedback</span>
              <span className="text-emerald-400 font-normal">Required</span>
            </span>
            <p className="text-xs text-paper-muted leading-relaxed">
              Please provide your review, verification remarks, or feedback for the assignee before completing this ticket.
            </p>
            <textarea
              id="complete-review-textarea"
              rows={4}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="e.g. Verified deliverables on staging. Code meets all quality standards and acceptance criteria. Approved!"
              className="mt-1 w-full resize-none rounded-xl border border-line bg-ink/60 p-3.5 text-sm text-paper outline-none transition-all placeholder:text-paper-muted/50 focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              disabled={completeLoading}
              onClick={() => setCompleteModalOpen(false)}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-paper-muted transition-colors hover:bg-line hover:text-paper disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={completeLoading || !reviewComment.trim()}
              onClick={handleCompleteWithReview}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-emerald-950/40 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 cursor-pointer"
            >
              {completeLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Complete Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Assignment Modal — only for assignee while ticket is Open */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Assignment"
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-5">
          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/8 p-4">
            <XCircle className="mt-0.5 size-5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">Reject Assignment</p>
              <p className="mt-0.5 text-xs text-paper-muted leading-relaxed">
                You are rejecting the assignment of ticket <span className="font-semibold text-paper">"{ticket?.title}"</span>. Once rejected, the ticket status will change to <span className="font-semibold text-red-300">Rejected</span>.
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-paper">
              Reason for Rejection <span className="text-red-400">*</span>
            </span>
            <p className="text-xs text-paper-muted leading-relaxed">
              Please explain why you are rejecting this assignment. This will be recorded as a comment.
            </p>
            <textarea
              id="reject-reason-textarea"
              rows={4}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. I don't have the required skills for this task, or the requirements are unclear..."
              className="mt-1 w-full resize-none rounded-xl border border-line bg-ink/60 p-3.5 text-sm text-paper outline-none transition-all placeholder:text-paper-muted/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              disabled={rejectLoading}
              onClick={() => setRejectModalOpen(false)}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-paper-muted transition-colors hover:bg-line hover:text-paper disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={rejectLoading || !rejectReason.trim()}
              onClick={handleRejectAssignment}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-red-950/40 transition-all hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 cursor-pointer"
            >
              {rejectLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <XCircle className="size-4" />
                  <span>Reject Assignment</span>
                </>
              )}
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
  email,
  warn = false,
}: {
  icon: typeof User
  label: string
  value: string
  email?: string | null
  warn?: boolean
}) {
  return (
    <div>
      <span className="flex items-center gap-2 text-xs text-paper-muted">
        <Icon className="size-3" />
        {label}
      </span>
      <div className="mt-0.5">
        <span
          className={`block text-sm font-medium ${
            warn ? 'text-red-400' : 'text-paper'
          }`}
        >
          {value}
        </span>
        {email && (
          <span
            className="mt-0.5 flex items-center gap-1.5 text-[11px] font-mono text-paper-muted/80 break-all"
            title={email}
          >
            <Mail className="size-2.5 shrink-0 text-brand" />
            <span>{email}</span>
          </span>
        )}
      </div>
    </div>
  )
}
