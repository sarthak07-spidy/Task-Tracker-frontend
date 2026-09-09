import { motion } from 'framer-motion'
import { Mail, Briefcase, Building2, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ease = [0.22, 1, 0.36, 1] as const

export default function Profile() {
  const { user } = useAuth()

  if (!user) return null

  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="font-display text-2xl font-bold text-paper">Profile</h1>
        <p className="mt-1 text-sm text-paper-muted">Your account details.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease }}
        className="rounded-2xl border border-line bg-ink-soft p-8"
      >
        <div className="flex items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-amber text-2xl font-bold text-paper shadow-lg shadow-brand/20">
            {initials}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-paper">
              {user.firstName} {user.lastName}
            </h2>
            <span className="mt-1 inline-block rounded-lg bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
              {user.role}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <InfoCard
            icon={Mail}
            label="Email"
            value={user.email}
            color="#3b82f6"
          />
          <InfoCard
            icon={Briefcase}
            label="Role"
            value={user.role}
            color="#a855f7"
          />
        </div>
      </motion.div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Mail
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3">
      <div
        className="rounded-lg p-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="size-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-paper-muted">{label}</p>
        <p className="text-sm font-medium text-paper">{value}</p>
      </div>
    </div>
  )
}
