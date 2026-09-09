// ─── Generic API Response ───────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message: string
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export interface AuthUser {
  userId: number
  email: string
  firstName: string
  lastName: string
  role: string
  token: string
  refreshToken: string
}

export interface RegisterPayload {
  email: string
  firstName: string
  lastName: string
  password: string
  designation?: string
  department?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RefreshPayload {
  refreshToken: string
}

export interface RefreshResponse {
  token: string
  refreshToken: string
}

// ─── User ───────────────────────────────────────────────────────────────────
export interface User {
  userId: number
  email: string
  firstName: string
  lastName: string
  role: string
  designation?: string
  department?: string
}

export interface UserProfile extends User {
  createdAt?: string
}

export interface DashboardProject {
  id: number
  name: string
  description?: string | null
  companyName?: string
  status?: string
  startDate?: string
  endDate?: string | null
  teamSize?: number
  ticketCount?: number
  createdByName?: string
  createdAt?: string
}

export interface UserDashboard {
  totalProjects?: number
  activeProjects?: number
  completedProjects?: number
  totalEmployees?: number
  totalTickets?: number
  openTickets?: number
  inProgressTickets?: number
  completedTickets?: number
  inReviewTickets?: number
  recentProjects?: DashboardProject[]
  recentTickets?: Ticket[]
  [key: string]: unknown
}

// ─── Ticket ─────────────────────────────────────────────────────────────────
export interface Ticket {
  id: number
  title: string
  description: string
  status: string | number
  priority: number
  category: number
  createdByUserId: number
  createdByName: string
  createdByEmail?: string
  assignedToUserId: number | null
  assignedToName: string | null
  assignedToEmail?: string | null
  assignedByUserId?: number | null
  dueDate: string
  userStoryId?: string | null
  sprintPhase?: string | null
  tags?: string | null
  estimatedHours?: number | null
  actualHours?: number | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  approvalStatus?: string
  approvalRemark?: string | null
  projectId?: number | null
}

export interface TicketListResponse {
  totalCount: number
  tickets: Ticket[]
}

export interface CreateTicketPayload {
  title: string
  description: string
  dueDate: string
  projectId?: number | null
  assignedToUserId?: number | null
  priority?: string
  category?: string
  userStoryId?: string
  sprintPhase?: string
  tags?: string
  estimatedHours?: number
}

export interface UpdateTicketPayload {
  title?: string
  description?: string
  dueDate?: string
  status?: string
  priority?: string
  category?: string
  userStoryId?: string
  sprintPhase?: string
  tags?: string
  estimatedHours?: number
}

export interface TicketFilters {
  status?: string
  assignedToUserId?: number
  createdByUserId?: number
  category?: string
  priority?: string
  userStoryId?: string
  sprintPhase?: string
  fromDate?: string
  toDate?: string
  projectId?: number
  pageNumber?: number
  pageSize?: number
}

// ─── Comments ───────────────────────────────────────────────────────────────
export interface Comment {
  id: number
  ticketId?: number
  content: string
  userId: number
  userName: string
  userEmail: string
  createdAt: string
  likes?: number
  parentCommentId?: number | null
  replies?: Comment[]
}

export interface CommentThread {
  ticketId: number
  ticketTitle: string
  totalComments: number
  comments: Comment[]
}

export interface AddCommentPayload {
  content: string
  parentCommentId?: number | null
}

// ─── Project ────────────────────────────────────────────────────────────────
export interface Project {
  id: number
  name: string
  description?: string | null
  companyName?: string | null
  dueDate?: string
  startDate?: string
  endDate?: string | null
  budget?: number | null
  status?: string
  createdByUserId?: number
  createdByName?: string
  createdAt?: string
  updatedAt?: string
  completedAt?: string | null
  memberCount?: number
  teamSize?: number
  ticketCount?: number
  [key: string]: unknown
}

export interface ProjectListResponse {
  totalCount?: number
  projects?: Project[]
  // some endpoints may return array directly
}

export interface CreateProjectPayload {
  name: string
  description?: string
  dueDate: string
  budget?: number
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  dueDate?: string
  budget?: number
}

// ─── Project Members ────────────────────────────────────────────────────────
export interface ProjectMember {
  userId: number
  firstName: string
  lastName: string
  email: string
  role: string
  designation?: string
  department?: string
}

export interface AddMemberPayload {
  projectId: number
  userId: number
  role: string
}

export interface ChangeMemberRolePayload {
  role: string
}

// ─── Reports / Analytics ────────────────────────────────────────────────────
export interface CompletedProject {
  id: number
  name: string
  description?: string
  completedAt: string
  dueDate: string
  budget?: number
  memberCount?: number
  ticketCount?: number
  [key: string]: unknown
}

export interface ProjectAnalytics {
  totalProjects?: number
  completedProjects?: number
  activeProjects?: number
  overdueProjects?: number
  [key: string]: unknown
}

export interface TeamAnalytics {
  totalMembers?: number
  members?: Array<{
    userId: number
    name: string
    totalTickets?: number
    completedTickets?: number
    totalHoursLogged?: number
    [key: string]: unknown
  }>
  [key: string]: unknown
}

export interface TicketAnalytics {
  totalTickets?: number
  statusBreakdown?: Record<string, number>
  priorityBreakdown?: Record<string, number>
  categoryBreakdown?: Record<string, number>
  [key: string]: unknown
}

// ─── Super Admin ────────────────────────────────────────────────────────────
export interface AdminDashboard {
  totalUsers?: number
  totalProjects?: number
  totalTickets?: number
  [key: string]: unknown
}

// ─── Pagination ─────────────────────────────────────────────────────────────
export interface PaginationParams {
  pageNumber?: number
  pageSize?: number
}
