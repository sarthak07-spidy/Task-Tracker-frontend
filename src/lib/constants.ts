// ─── Ticket Status ──────────────────────────────────────────────────────────
export const statusMapping: Record<string, string> = {
  Open: 'Open',
  InProgress: 'In Progress',
  InReview: 'In Review',
  Completed: 'Completed',
  Closed: 'Completed',
  Rejected: 'Rejected',
  OnHold: 'On Hold',
}

export const TicketStatus = {
  Open: 'Open',
  InProgress: 'InProgress',
  InReview: 'InReview',
  Completed: 'Completed',
  Closed: 'Closed',
  Rejected: 'Rejected',
  OnHold: 'OnHold',
} as const

export type TicketStatusValue = (typeof TicketStatus)[keyof typeof TicketStatus]

export const TicketStatusLabel: Record<string | number, string> = {
  Open: 'Open',
  InProgress: 'In Progress',
  InReview: 'In Review',
  Completed: 'Completed',
  Closed: 'Completed',
  Close: 'Completed',
  Rejected: 'Rejected',
  Reject: 'Rejected',
  OnHold: 'On Hold',
  1: 'Open',
  2: 'In Progress',
  3: 'In Review',
  4: 'Completed',
  5: 'Completed',
  6: 'Rejected',
  7: 'On Hold',
}

export const TicketStatusKey: Record<string | number, string> = {
  Open: 'Open',
  InProgress: 'InProgress',
  InReview: 'InReview',
  Completed: 'Completed',
  Closed: 'Closed',
  Close: 'Closed',
  Rejected: 'Rejected',
  Reject: 'Rejected',
  OnHold: 'OnHold',
  1: 'Open',
  2: 'InProgress',
  3: 'InReview',
  4: 'Completed',
  5: 'Closed',
  6: 'Rejected',
  7: 'OnHold',
}

export const TicketStatusColor: Record<string | number, string> = {
  Open: '#3b82f6',       // blue
  InProgress: '#f59e0b', // amber
  InReview: '#a855f7',   // purple
  Completed: '#22c55e',  // green
  Closed: '#10b981',     // emerald green for completed/closed
  Close: '#10b981',
  Rejected: '#ef4444',   // red
  Reject: '#ef4444',
  OnHold: '#f97316',     // orange
  1: '#3b82f6',
  2: '#f59e0b',
  3: '#a855f7',
  4: '#22c55e',
  5: '#10b981',
  6: '#ef4444',
  7: '#f97316',
}

export const TicketStatusBg: Record<string | number, string> = {
  Open: 'rgba(59,130,246,0.15)',
  InProgress: 'rgba(245,158,11,0.15)',
  InReview: 'rgba(168,85,247,0.15)',
  Completed: 'rgba(34,197,94,0.15)',
  Closed: 'rgba(16,185,129,0.15)',
  Close: 'rgba(16,185,129,0.15)',
  Rejected: 'rgba(239,68,68,0.15)',
  Reject: 'rgba(239,68,68,0.15)',
  OnHold: 'rgba(249,115,22,0.15)',
  1: 'rgba(59,130,246,0.15)',
  2: 'rgba(245,158,11,0.15)',
  3: 'rgba(168,85,247,0.15)',
  4: 'rgba(34,197,94,0.15)',
  5: 'rgba(16,185,129,0.15)',
  6: 'rgba(239,68,68,0.15)',
  7: 'rgba(249,115,22,0.15)',
}

export function isTicketCompleted(ticketOrStatus: unknown): boolean {
  if (!ticketOrStatus) return false
  const statusVal =
    typeof ticketOrStatus === 'object' && ticketOrStatus !== null && 'status' in ticketOrStatus
      ? (ticketOrStatus as { status?: unknown }).status
      : ticketOrStatus
  const s = String(statusVal ?? '').toLowerCase().trim()

  return (
    s === 'closed' ||
    s === 'close' ||
    s === 'completed' ||
    s === '5' ||
    s === '4' ||
    statusVal === 5 ||
    statusVal === 4
  )
}

export function isTicketRejected(ticketOrStatus: unknown): boolean {
  if (!ticketOrStatus) return false
  const statusVal =
    typeof ticketOrStatus === 'object' && ticketOrStatus !== null && 'status' in ticketOrStatus
      ? (ticketOrStatus as { status?: unknown }).status
      : ticketOrStatus
  const s = String(statusVal ?? '').toLowerCase().trim()
  return s === 'rejected' || s === 'reject' || s === '6' || statusVal === 6
}

// ─── Priority ───────────────────────────────────────────────────────────────
export const Priority = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
} as const

export type PriorityValue = (typeof Priority)[keyof typeof Priority]

export const PriorityLabel: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
}

export const PriorityColor: Record<number, string> = {
  1: '#22c55e',
  2: '#f59e0b',
  3: '#f97316',
  4: '#ef4444',
}

export const PriorityBg: Record<number, string> = {
  1: 'rgba(34,197,94,0.15)',
  2: 'rgba(245,158,11,0.15)',
  3: 'rgba(249,115,22,0.15)',
  4: 'rgba(239,68,68,0.15)',
}

// ─── Category ───────────────────────────────────────────────────────────────
export const Category = {
  Development: 1,
  Testing: 2,
  Bug: 3,
  Deployment: 4,
  Design: 5,
  Documentation: 6,
  DevOps: 7,
  Analytics: 8,
  Support: 9,
  Enhancement: 10,
} as const

export type CategoryValue = (typeof Category)[keyof typeof Category]

export const CategoryLabel: Record<number, string> = {
  1: 'Development',
  2: 'Testing',
  3: 'Bug',
  4: 'Deployment',
  5: 'Design',
  6: 'Documentation',
  7: 'DevOps',
  8: 'Analytics',
  9: 'Support',
  10: 'Enhancement',
}

export const CategoryColor: Record<number, string> = {
  1: '#3b82f6',
  2: '#8b5cf6',
  3: '#ef4444',
  4: '#06b6d4',
  5: '#ec4899',
  6: '#6366f1',
  7: '#14b8a6',
  8: '#f59e0b',
  9: '#10b981',
  10: '#0ea5e9',
}

// ─── Project Member Roles ───────────────────────────────────────────────────
export const MemberRole = {
  Developer: 'Developer',
  TeamLead: 'TeamLead',
  Manager: 'Manager',
} as const

export type MemberRoleValue = (typeof MemberRole)[keyof typeof MemberRole]

export const MemberRoleLabel: Record<string, string> = {
  Developer: 'Developer',
  TeamLead: 'Team Lead',
  Manager: 'Manager',
}

// ─── User Roles ─────────────────────────────────────────────────────────────
export const UserRole = {
  Employee: 'Employee',
  Manager: 'Manager',
  SuperAdmin: 'SuperAdmin',
} as const

// ─── Approval Status ────────────────────────────────────────────────────────
export const ApprovalStatus = {
  None: 'None',
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
} as const

// ─── API Base ───────────────────────────────────────────────────────────────
export const API_BASE_URL = 'https://localhost:7201/api'

// ─── Pagination Defaults ────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_PAGE_NUMBER = 1
