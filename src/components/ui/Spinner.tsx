export default function Spinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeMap = { sm: 'size-4', md: 'size-6', lg: 'size-10' }
  return (
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-2 border-paper/20 border-t-brand ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <span className="text-sm text-paper-muted">Loading…</span>
      </div>
    </div>
  )
}
