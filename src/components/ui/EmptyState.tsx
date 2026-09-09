import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: typeof Inbox
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-2xl border border-line bg-ink/60 p-4">
        <Icon className="size-8 text-paper-muted" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-paper">
          {title}
        </h3>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-paper-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
