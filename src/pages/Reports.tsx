import { motion } from 'framer-motion'
import { BarChart3, Construction } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1] as const

export default function Reports() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="font-display text-2xl font-bold text-paper">Reports</h1>
        <p className="mt-1 text-sm text-paper-muted">
          Analytics and insights across your projects.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease }}
        className="flex flex-col items-center justify-center rounded-2xl border border-line bg-ink-soft px-8 py-20 text-center"
      >
        <div className="mb-4 rounded-2xl bg-amber/15 p-4">
          <Construction className="size-8 text-amber" />
        </div>
        <h2 className="font-display text-xl font-bold text-paper">
          Coming Soon
        </h2>
        <p className="mt-2 max-w-sm text-sm text-paper-muted">
          Reports and analytics are under development. You'll soon be able to
          view ticket trends, team performance, and project progress here.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-ink/60 px-4 py-2 text-xs text-paper-muted">
          <BarChart3 className="size-4" />
          Ticket analytics • Team performance • Project insights
        </div>
      </motion.div>
    </div>
  )
}
