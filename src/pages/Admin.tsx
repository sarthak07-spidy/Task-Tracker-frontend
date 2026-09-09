import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  Search,
  FolderKanban,
  UserCheck,
  Mail,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import Spinner, { PageLoader } from '../components/ui/Spinner'

const ease = [0.22, 1, 0.36, 1] as const

interface AdminUser {
  id: number
  fullName: string
  email: string
  userType: string
  department?: string
  createdAt?: string
}

interface ProjectItem {
  id: number
  name: string
  status?: string
}

export default function Admin() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  async function loadAdminData() {
    setLoading(true)
    setError('')

    try {
      // 1. Fetch Users
      let userList: AdminUser[] = []
      try {
        const res = await api.get('/SuperAdmin/users')
        const raw = res.data?.success ? res.data.data : res.data
        if (Array.isArray(raw)) userList = raw
      } catch {
        // Fallback to /Users/employees
        const res2 = await api.get('/Users/employees')
        const raw2 = res2.data?.success ? res2.data.data : res2.data
        if (Array.isArray(raw2)) {
          userList = raw2.map((u: Record<string, unknown>) => ({
            id: u.id as number,
            fullName: u.fullName as string,
            email: u.email as string,
            userType: (u.userType as string) || 'Employee',
            department: u.department as string,
            createdAt: u.createdAt as string,
          }))
        }
      }

      setUsers(userList)

      // 2. Fetch Projects for overview count
      try {
        const projRes = await api.get('/projects/all', { params: { pageSize: 100 } })
        const pRaw = projRes.data?.success ? projRes.data.data : projRes.data
        const pList = Array.isArray(pRaw) ? pRaw : (pRaw?.projects ?? [])
        setProjects(pList)
      } catch {
        setProjects([])
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to load user management data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalUsers = users.length
    const superAdmins = users.filter(
      (u) => u.userType?.toLowerCase() === 'superadmin',
    ).length
    const employees = users.filter(
      (u) => u.userType?.toLowerCase() === 'employee',
    ).length
    const totalProjects = projects.length

    return { totalUsers, superAdmins, employees, totalProjects }
  }, [users, projects])

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = u.fullName?.toLowerCase().includes(q)
        const emailMatch = u.email?.toLowerCase().includes(q)
        const deptMatch = u.department?.toLowerCase().includes(q)
        if (!nameMatch && !emailMatch && !deptMatch) return false
      }

      if (roleFilter !== 'ALL') {
        if (u.userType?.toLowerCase() !== roleFilter.toLowerCase()) return false
      }

      return true
    })
  }, [users, searchQuery, roleFilter])

  if (loading) return <PageLoader />

  const roleColors: Record<string, { color: string; bg: string }> = {
    SuperAdmin: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    Admin: { color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
    Manager: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    Employee: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Shield className="size-5" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-paper">
              SuperAdmin Console
            </h1>
          </div>
          <p className="mt-1 text-sm text-paper-muted">
            Manage system users, access roles, and permissions across the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAdminData}
          className="flex items-center gap-2 rounded-xl border border-line bg-ink-soft px-3.5 py-2 text-xs font-medium text-paper-muted transition-all hover:border-paper/30 hover:text-paper"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle className="size-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-line bg-ink-soft p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
              Total Users
            </span>
            <div className="rounded-xl bg-brand/15 p-2 text-brand">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-paper">
            {metrics.totalUsers}
          </p>
          <p className="mt-1 text-xs text-paper-muted">Registered accounts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-line bg-ink-soft p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
              Employees
            </span>
            <div className="rounded-xl bg-cobalt/15 p-2 text-cobalt">
              <UserCheck className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-cobalt">
            {metrics.employees}
          </p>
          <p className="mt-1 text-xs text-paper-muted">Standard access</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-2xl border border-line bg-ink-soft p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
              SuperAdmins
            </span>
            <div className="rounded-xl bg-purple-500/15 p-2 text-purple-400">
              <Shield className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-purple-400">
            {metrics.superAdmins}
          </p>
          <p className="mt-1 text-xs text-paper-muted">Full system control</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-2xl border border-line bg-ink-soft p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
              Projects
            </span>
            <div className="rounded-xl bg-amber/15 p-2 text-amber">
              <FolderKanban className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-amber">
            {metrics.totalProjects}
          </p>
          <p className="mt-1 text-xs text-paper-muted">Active in workspace</p>
        </motion.div>
      </div>

      {/* User Directory Section */}
      <div className="rounded-3xl border border-line bg-ink-soft p-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-paper">
              User Directory ({filteredUsers.length})
            </h2>
            <p className="text-xs text-paper-muted">
              View all user accounts, contact information, and role assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-paper-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, department..."
                className="w-full rounded-xl border border-line bg-ink pl-10 pr-4 py-2 text-sm text-paper placeholder:text-paper-muted/50 focus:border-brand focus:outline-none"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-line bg-ink p-1 text-xs">
              {['ALL', 'SuperAdmin', 'Employee'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                    roleFilter === role
                      ? 'bg-brand text-paper'
                      : 'text-paper-muted hover:text-paper'
                  }`}
                >
                  {role === 'ALL' ? 'All' : role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="mt-6 overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-paper-muted">
              No users found matching "{searchQuery}"
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-paper-muted">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredUsers.map((u) => {
                  const roleStyle =
                    roleColors[u.userType] ?? {
                      color: '#94a3b8',
                      bg: 'rgba(148,163,184,0.12)',
                    }
                  const initials =
                    u.fullName
                      ?.split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'U'

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-ink/40 group"
                    >
                      {/* Name & Email */}
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-cobalt/20 text-xs font-bold text-paper border border-line">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-paper group-hover:text-brand transition-colors">
                              {u.fullName}
                              {user?.email === u.email && (
                                <span className="ml-2 rounded-md bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-paper-muted flex items-center gap-1">
                              <Mail className="size-3" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4">
                        <span
                          className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{
                            color: roleStyle.color,
                            backgroundColor: roleStyle.bg,
                          }}
                        >
                          {u.userType}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-4 text-xs text-paper-muted">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-paper-muted/60" />
                          {u.department && u.department !== 'string'
                            ? u.department
                            : 'General'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 text-xs text-paper-muted">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-paper-muted/60" />
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-2 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
