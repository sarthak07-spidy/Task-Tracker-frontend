interface BadgeProps {
  label: string
  color: string
  bg?: string
  className?: string
  dot?: boolean
  size?: 'sm' | 'md'
}

export default function Badge({
  label,
  color,
  bg,
  className = '',
  dot = false,
  size = 'sm',
}: BadgeProps) {
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses} ${className}`}
      style={{
        color,
        backgroundColor: bg ?? `${color}22`,
      }}
    >
      {dot && (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  )
}
