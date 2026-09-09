import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Ticket,
  FolderKanban,
  BarChart3,
  Shield,
  UserCircle,
  ChevronLeft,
  LogOut,
  Menu,
} from 'lucide-react'
import { useState } from 'react'
import { LogoMark } from '../Logo'
import { useAuth } from '../../context/AuthContext'

const ease = [0.22, 1, 0.36, 1] as const

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  roles?: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Tickets', to: '/app/tickets', icon: Ticket },
  { label: 'Projects', to: '/app/projects', icon: FolderKanban },
  { label: 'Reports', to: '/app/reports', icon: BarChart3 },
  {
    label: 'Admin',
    to: '/app/admin',
    icon: Shield,
    roles: ['SuperAdmin'],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  })

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5">
        <span className="shrink-0">
          <LogoMark size={36} />
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease }}
              className="overflow-hidden whitespace-nowrap font-display text-lg font-bold text-paper"
            >
              T-tracker
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/app/dashboard' &&
              location.pathname.startsWith(item.to))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand/15 text-brand'
                  : 'text-paper-muted hover:bg-line hover:text-paper'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="size-[18px] shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )
        })}
      </nav>

      {/* User section */}
      <div className="mt-auto border-t border-line px-3 py-4">
        <NavLink
          to="/app/profile"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            location.pathname === '/app/profile'
              ? 'bg-brand/15 text-brand'
              : 'text-paper-muted hover:bg-line hover:text-paper'
          }`}
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-amber text-[10px] font-bold text-paper">
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-semibold text-paper">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[11px] text-paper-muted">
                  {user?.role}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </NavLink>

        <button
          type="button"
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-paper-muted transition-all duration-200 hover:bg-red-500/15 hover:text-red-400"
        >
          <LogOut className="size-[18px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease }}
                className="overflow-hidden whitespace-nowrap"
              >
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle - desktop only */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="hidden border-t border-line px-4 py-3 text-paper-muted transition-colors hover:text-paper lg:flex lg:items-center lg:justify-center"
      >
        <ChevronLeft
          className={`size-4 transition-transform duration-300 ${
            collapsed ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-line bg-ink-soft p-2.5 text-paper-muted shadow-lg lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease }}
            className="fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-ink-soft lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease }}
        className="fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-ink-soft lg:block"
      >
        {sidebarContent}
      </motion.aside>

      {/* Spacer for desktop layout */}
      <motion.div
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease }}
        className="hidden shrink-0 lg:block"
      />
    </>
  )
}
