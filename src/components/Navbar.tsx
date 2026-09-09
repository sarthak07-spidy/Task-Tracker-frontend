import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Logo from './Logo'

export default function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 py-3 transition-all duration-500 sm:px-8 ${
          scrolled ? 'mt-3 rounded-full glass shadow-2xl shadow-ink/60' : 'mt-0'
        }`}
      >
        <Logo />

        <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-6">
          {pathname === '/' && (
            <>
              <a
                href="#story"
                className="hidden text-sm font-medium text-paper-muted transition-colors hover:text-paper sm:inline"
              >
                Story
              </a>
              <a
                href="#problem"
                className="hidden text-sm font-medium text-paper-muted transition-colors hover:text-paper sm:inline"
              >
                Why
              </a>
              <a
                href="#solution"
                className="hidden text-sm font-medium text-paper-muted transition-colors hover:text-paper sm:inline"
              >
                How
              </a>
            </>
          )}
          <Link
            to="/auth"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:px-5 sm:py-2.5"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-brand via-amber to-cobalt transition-transform duration-500 ease-out group-hover:translate-x-0" />
            <span className="relative transition-colors duration-300 group-hover:text-paper">
              Login / Sign up
            </span>
            <ArrowUpRight className="relative size-4 transition-all duration-300 group-hover:rotate-45 group-hover:text-paper" />
          </Link>
        </nav>
      </div>
    </motion.header>
  )
}
