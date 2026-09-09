import { motion } from 'framer-motion'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { useTheme, type Theme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options: Array<{
    id: Theme
    label: string
    shortLabel: string
    icon: typeof Moon
    badgeColor?: string
  }> = [
    { id: 'dark', label: 'Dark', shortLabel: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', shortLabel: 'Light', icon: Sun },
    {
      id: 'crazy',
      label: 'Crazy Yenner',
      shortLabel: 'Crazy',
      icon: Sparkles,
      badgeColor: 'from-amber-400 via-rose-500 to-indigo-500',
    },
  ]

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className="relative flex items-center rounded-2xl border border-line bg-ink/60 p-1 backdrop-blur-md shadow-inner"
    >
      {options.map((opt) => {
        const Icon = opt.icon
        const isActive = theme === opt.id

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            title={`Switch to ${opt.label} theme`}
            className={`relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
              isActive
                ? opt.id === 'crazy'
                  ? 'text-paper shadow-lg shadow-rose-500/25'
                  : 'text-paper shadow-md'
                : 'text-paper-muted hover:text-paper hover:bg-line/40'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className={`absolute inset-0 rounded-xl ${
                  opt.id === 'crazy'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-stone-950 font-bold shadow-[0_0_18px_rgba(245,158,11,0.55)]'
                    : opt.id === 'light'
                    ? 'bg-brand text-paper shadow-[0_0_12px_rgba(14,165,233,0.45)]'
                    : 'bg-paper/20 border border-paper/30'
                }`}
              />
            )}

            <span className={`relative z-10 flex items-center gap-1.5 ${isActive && opt.id === 'crazy' ? 'text-stone-950 font-bold' : ''}`}>
              <Icon
                className={`size-3.5 transition-transform duration-300 ${
                  isActive && opt.id === 'crazy' ? 'rotate-12 scale-110' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {opt.label}
              </span>
              <span className="sm:hidden">
                {opt.shortLabel}
              </span>
              {opt.id === 'crazy' && (
                <span
                  aria-hidden="true"
                  className="relative flex size-2 items-center justify-center"
                >
                  <span className="absolute size-2 animate-ping rounded-full bg-amber-600 opacity-75" />
                  <span className="relative size-1.5 rounded-full bg-stone-950" />
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
