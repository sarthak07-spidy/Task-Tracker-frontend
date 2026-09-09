import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
} from 'lucide-react'
import api from '../../lib/api'
import type { ApiResponse, Ticket } from '../../lib/types'
import {
  TicketStatusLabel,
  TicketStatusColor,
  PriorityLabel,
  PriorityColor,
} from '../../lib/constants'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import Spinner from '../ui/Spinner'
import { useToast } from '../ui/Toast'
import { useAuth } from '../../context/AuthContext'

const ease = [0.22, 1, 0.36, 1] as const

export default function ApprovalPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Approve/Reject modal
  const [actionTicket, setActionTicket] = useState<Ticket | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [remark, setRemark] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const isManager =
    user?.role === 'Manager' ||
    user?.role === 'SuperAdmin' ||
    user?.role === 'TeamLead'

  useEffect(() => {
    if (!isManager) return
    fetchPending()
  }, [isManager])

  async function fetchPending() {
    setLoading(true)
    try {
      const { data } = await api.get(
        '/tickets/approval-status/in-process',
        { params: { pageNumber: 1, pageSize: 20 } },
      )
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
    } catch {
      setTickets([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  function openAction(ticket: Ticket, type: 'approve' | 'reject') {
    setActionTicket(ticket)
    setActionType(type)
    setRemark('')
  }

  async function submitAction() {
    if (!actionTicket) return
    setActionLoading(true)
    try {
      if (actionType === 'approve') {
        await api.put(`/tickets/${actionTicket.id}/approve-completion`, {
          approvalRemark: remark || 'Approved',
        })
        toast('success', 'Ticket approved successfully')
      } else {
        await api.put(`/tickets/${actionTicket.id}/reject-completion`, {
          rejectionReason: remark || 'Needs changes',
        })
        toast('info', 'Ticket sent back for changes')
      }
      setActionTicket(null)
      fetchPending()
    } catch (err: unknown) {
      toast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Action failed',
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (!isManager) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="rounded-2xl border border-line bg-ink-soft p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-paper">
            <Eye className="size-5 text-purple-400" />
            Pending Review ({totalCount})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : tickets.length === 0 ? (
          <p className="py-6 text-center text-sm text-paper-muted">
            No tickets pending review
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center gap-4 rounded-xl border border-line px-4 py-3"
              >
                <Link
                  to={`/app/tickets/${ticket.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="truncate text-sm font-medium text-paper hover:text-brand transition-colors">
                    {ticket.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-paper-muted">
                    <span>{ticket.assignedToName ?? 'Unassigned'}</span>
                    <span>
                      Due{' '}
                      {new Date(ticket.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge
                    label={PriorityLabel[ticket.priority] ?? 'Medium'}
                    color={PriorityColor[ticket.priority] ?? '#f59e0b'}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => openAction(ticket, 'approve')}
                    className="rounded-lg bg-green-500/15 p-2 text-green-400 transition-colors hover:bg-green-500/25"
                    title="Approve"
                  >
                    <CheckCircle className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction(ticket, 'reject')}
                    className="rounded-lg bg-red-500/15 p-2 text-red-400 transition-colors hover:bg-red-500/25"
                    title="Reject"
                  >
                    <XCircle className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Action modal */}
      <Modal
        open={!!actionTicket}
        onClose={() => setActionTicket(null)}
        title={
          actionType === 'approve'
            ? 'Approve Completion'
            : 'Reject Completion'
        }
        maxWidth="max-w-md"
      >
        <p className="mb-4 text-sm text-paper-muted">
          {actionType === 'approve'
            ? `Approve "${actionTicket?.title}"? Add an optional remark.`
            : `Reject "${actionTicket?.title}"? Please provide a reason.`}
        </p>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder={
            actionType === 'approve'
              ? 'Great work! (optional)'
              : 'Reason for rejection…'
          }
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand"
          required={actionType === 'reject'}
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setActionTicket(null)}
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-paper-muted hover:bg-line"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitAction}
            disabled={actionLoading || (actionType === 'reject' && !remark.trim())}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50 ${
              actionType === 'approve'
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {actionLoading ? (
              <Spinner size="sm" />
            ) : actionType === 'approve' ? (
              'Approve'
            ) : (
              'Reject'
            )}
          </button>
        </div>
      </Modal>
    </>
  )
}
