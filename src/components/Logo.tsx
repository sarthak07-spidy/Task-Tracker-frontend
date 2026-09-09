import { Link } from 'react-router-dom'

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-[0_8px_24px_rgba(228,55,28,0.35)]"
    >
      <rect width="64" height="64" rx="16" fill="var(--color-ink-soft)" />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        stroke="rgba(246,243,238,0.14)"
        strokeWidth="1.5"
      />
      <rect x="14" y="16" width="36" height="8" rx="4" fill="var(--color-brand)" />
      <rect x="28" y="24" width="8" height="26" rx="4" fill="var(--color-paper)" />
      <circle cx="46" cy="20" r="6" fill="var(--color-amber)" />
      <circle cx="46" cy="20" r="2.2" fill="var(--color-ink)" />
    </svg>
  )
}

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="T-tracker home"
      className={`group flex items-center gap-3 ${className}`}
    >
      <span className="transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <LogoMark size={40} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight text-paper">
          T-tracker
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-paper-muted">
          by yenDigital
        </span>
      </span>
    </Link>
  )
}
