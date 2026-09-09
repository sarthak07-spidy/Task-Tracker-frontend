import { Link } from 'react-router-dom'
import {
  Calendar,
  User,
  Clock,
} from 'lucide-react'
import type { Ticket } from '../../lib/types'
import {
  TicketStatusLabel,
  TicketStatusColor,
  TicketStatusBg,
  PriorityLabel,
  PriorityColor,
  CategoryLabel,
  CategoryColor,
} from '../../lib/constants'
import Badge from '../ui/Badge'
import Parallax3DCard from '../ui/Parallax3DCard'

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const isOverdue =
    new Date(ticket.dueDate) < new Date() &&
    ticket.status !== 'Completed' &&
    ticket.status !== 'Closed' &&
    Number(ticket.status) !== 4 &&
    Number(ticket.status) !== 5

  return (
    <Parallax3DCard intensity={12} glare={true} depthEffect={true}>
      <Link
        to={`/app/tickets/${ticket.id}`}
        className="group relative flex flex-col gap-3 rounded-2xl border border-line bg-ink-soft p-5 transition-all duration-200 hover:border-paper/20 hover:shadow-lg hover:shadow-ink/40 crazy-ticket-card"
      >
        {/* Priority bar */}
        <div
          className="absolute left-0 top-4 h-8 w-[3px] rounded-full crazy-ticket-priority"
          style={{ backgroundColor: PriorityColor[ticket.priority] ?? '#f59e0b' }}
        />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 crazy-ticket-title">
        <h3 className="flex-1 text-sm font-semibold text-paper group-hover:text-brand transition-colors line-clamp-2">
          {ticket.title}
        </h3>
        <span className="shrink-0 text-xs text-paper-muted">#{ticket.id}</span>
      </div>

      {/* Description */}
      {ticket.description && (
        <p className="text-xs text-paper-muted line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 crazy-ticket-badge">
        <Badge
          label={TicketStatusLabel[ticket.status] ?? 'Open'}
          color={TicketStatusColor[ticket.status] ?? '#3b82f6'}
          bg={TicketStatusBg[ticket.status]}
          dot
        />
        <Badge
          label={PriorityLabel[ticket.priority] ?? 'Medium'}
          color={PriorityColor[ticket.priority] ?? '#f59e0b'}
        />
        {ticket.category > 0 && (
          <Badge
            label={CategoryLabel[ticket.category] ?? ''}
            color={CategoryColor[ticket.category] ?? '#6b7280'}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-paper-muted crazy-ticket-footer">
        {ticket.assignedToName && (
          <span className="flex items-center gap-1">
            <User className="size-3" />
            {ticket.assignedToName}
          </span>
        )}
        <span
          className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}
        >
          <Calendar className="size-3" />
          {new Date(ticket.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        {(ticket.estimatedHours || ticket.actualHours) && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {ticket.actualHours ?? 0}h / {ticket.estimatedHours ?? 0}h
          </span>
        )}
      </div>
    </Link>
    </Parallax3DCard>
  )
}
