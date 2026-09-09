import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AuthCard from '../components/AuthCard'
import Logo from '../components/Logo'

export default function Auth() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-6 py-6">
      <div aria-hidden="true" className="absolute inset-0 grid-fade" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 [background:conic-gradient(from_90deg,transparent_0deg,rgba(228,55,28,0.3)_100deg,transparent_200deg,rgba(47,91,255,0.3)_290deg,transparent_360deg)] animate-spin-slow blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between"
      >
        <Logo />
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-paper-muted transition-colors hover:text-paper"
        >
          <ArrowLeft className="size-4" />
          Back to story
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 16 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1400 }}
        className="relative z-10 flex flex-1 items-center justify-center py-12"
      >
        <AuthCard initialMode="login" />
      </motion.div>
    </main>
  )
}
