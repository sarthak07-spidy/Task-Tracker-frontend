import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import AppHeader from './AppHeader'
import ErrorBoundary from '../ErrorBoundary'
import CrazyBackground from '../CrazyBackground'

export default function AppLayout() {
  return (
    <div className="relative flex min-h-screen bg-ink">
      <CrazyBackground />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
