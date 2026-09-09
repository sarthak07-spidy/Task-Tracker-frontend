import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import ThemeToggle from '../ui/ThemeToggle'

const breadcrumbMap: Record<string, string> = {
  app: 'Home',
  dashboard: 'Dashboard',
  tickets: 'Tickets',
  projects: 'Projects',
  reports: 'Reports',
  admin: 'Admin',
  profile: 'Profile',
  new: 'New',
}

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()

  const crumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    return parts.map((part, i) => ({
      label: breadcrumbMap[part] ?? (isNaN(Number(part)) ? part : `#${part}`),
      path: '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
    }))
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Breadcrumbs */}
        <nav className="flex items-center gap-1.5 pl-12 text-sm lg:pl-0">
          {crumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-paper-muted/40">/</span>
              )}
              {crumb.isLast ? (
                <span className="font-semibold text-paper">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-paper-muted transition-colors hover:text-paper"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Selector Toggle (Dark / Light / Crazy Yenner) */}
          <ThemeToggle />

          {/* Quick create */}
          <button
            type="button"
            onClick={() => navigate('/app/tickets/new')}
            className="flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-paper shadow-lg shadow-brand/35 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </button>
        </div>
      </div>
    </header>
  )
}
