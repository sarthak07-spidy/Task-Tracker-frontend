import { motion } from 'framer-motion'
import AuthCard from './AuthCard'

const ease = [0.22, 1, 0.36, 1] as const

export default function AuthSection() {
  return (
    <section
      id="auth"
      className="relative overflow-hidden px-6 py-28 sm:py-40"
      aria-labelledby="auth-heading"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-fade" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-14">
        <div className="max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.8, ease }}
            className="text-xs font-semibold uppercase tracking-[0.25em] text-amber"
          >
            Login · Sign up
          </motion.p>
          <motion.h2
            id="auth-heading"
            initial={{ opacity: 0, y: 40, rotateX: -20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="mt-4 font-display text-4xl font-bold tracking-tight text-balance sm:text-6xl"
          >
            Ready to get your hours back?
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 80, rotateX: 18 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1, delay: 0.15, ease }}
          style={{ perspective: 1400, transformStyle: 'preserve-3d' }}
          className="flex w-full justify-center"
        >
          <AuthCard initialMode="signup" />
        </motion.div>
      </div>
    </section>
  )
}
