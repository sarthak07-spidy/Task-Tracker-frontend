import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import TiltCard from './TiltCard'
import { LogoMark } from './Logo'
import { useAuth } from '../context/AuthContext'
import Spinner from './ui/Spinner'

const ease = [0.22, 1, 0.36, 1] as const

interface ForgotPasswordCardProps {
  onBackToLogin?: () => void
  initialEmail?: string
  compact?: boolean
  className?: string
}

export default function ForgotPasswordCard({
  onBackToLogin,
  initialEmail = '',
  compact = false,
  className = '',
}: ForgotPasswordCardProps) {
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const { forgotPassword } = useAuth()
  const navigate = useNavigate()

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  function handleBack() {
    if (onBackToLogin) {
      onBackToLogin()
    } else {
      navigate('/auth')
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return

    setError('')
    setLoading(true)

    try {
      await forgotPassword(email.trim())
      setSubmitted(true)
      setCooldown(60)
    } catch (err: unknown) {
      console.error('Forgot password error:', err)
      setError((err as Error)?.message || 'Unable to process request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setCooldown(60)
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to resend reset link.')
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <div className={`flex flex-col justify-center ${compact ? '' : 'p-7 sm:p-10'}`}>
      {/* Top action header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-muted transition-colors hover:text-paper cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to log in</span>
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-[11px] font-semibold text-amber">
          <KeyRound className="size-3" />
          Password Reset
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!submitted ? (
          <motion.form
            key="request-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            className="flex flex-col gap-5"
          >
            <div>
              <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl border border-line bg-gradient-to-br from-brand/20 via-amber/10 to-ink/60 shadow-inner">
                <KeyRound className="size-6 text-brand" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-paper">
                Forgot password?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-paper-muted">
                No worries, it happens! Enter your work email below and we'll send you instructions to reset your account password.
              </p>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key={error}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    x: [0, -6, 6, -4, 4, 0],
                  }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/15 px-4 py-3 shadow-lg shadow-red-950/40"
                >
                  <AlertCircle className="size-5 shrink-0 text-red-400" />
                  <span className="text-sm font-medium text-red-200">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <label htmlFor="reset-email" className="group flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-paper-muted">
                Work Email Address
              </span>
              <span className="flex items-center gap-3 rounded-xl border border-line bg-ink/60 px-4 py-3 transition-all focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(228,55,28,0.15)]">
                <Mail className="size-4 shrink-0 text-paper-muted transition-colors group-focus-within:text-brand" />
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-0 ring-0 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:outline-none focus:ring-0 focus:border-0 shadow-none"
                  placeholder="name@company.com"
                />
              </span>
            </label>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="group mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-paper shadow-[0_12px_40px_-12px_rgba(228,55,28,0.9)] transition-opacity disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>

            <div className="mt-2 text-center text-xs text-paper-muted">
              Remember your password?{' '}
              <button
                type="button"
                onClick={handleBack}
                className="font-semibold text-paper underline-offset-4 hover:underline cursor-pointer"
              >
                Log in
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            className="flex flex-col gap-5 text-left"
          >
            <div>
              <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="size-6 text-emerald-400" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-paper">
                Check your email
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-paper-muted">
                We've sent recovery instructions to:
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line bg-ink/70 px-3.5 py-2 font-mono text-sm font-medium text-paper">
                <Mail className="size-4 text-brand" />
                <span>{email}</span>
              </div>
            </div>

            <div className="rounded-xl border border-line/70 bg-ink/40 p-4 text-xs text-paper-muted leading-relaxed">
              <p className="flex items-start gap-2">
                <Sparkles className="size-4 shrink-0 text-amber mt-0.5" />
                <span>
                  Please click the link inside the email to set your new password. If you don't receive it within a few minutes, check your spam folder.
                </span>
              </p>
            </div>

            {/* Resend actions */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResend}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-ink/60 py-3 text-xs font-semibold text-paper transition-all hover:bg-paper/10 hover:border-line disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                {cooldown > 0
                  ? `Resend link in ${cooldown}s`
                  : 'Didn’t get the email? Resend link'}
              </button>

              <motion.button
                type="button"
                onClick={handleBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-paper shadow-[0_12px_40px_-12px_rgba(228,55,28,0.9)] cursor-pointer"
              >
                Return to log in
                <ArrowRight className="size-4" />
              </motion.button>
            </div>

            <div className="text-center text-xs text-paper-muted">
              Mistyped your email?{' '}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setError('')
                }}
                className="font-semibold text-paper underline-offset-4 hover:underline cursor-pointer"
              >
                Try another address
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (compact) {
    return (
      <div className={`w-full ${className}`}>
        {formContent}
      </div>
    )
  }

  return (
    <TiltCard intensity={5} glare={false} className={`w-full max-w-4xl ${className}`}>
      <div className="glass grid overflow-hidden rounded-[2rem] shadow-2xl shadow-ink/80 lg:grid-cols-[1.05fr_1fr]">
        {/* Left decorative panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand via-[#b8321c] to-ink p-10 lg:flex">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 size-72 rounded-full border-[28px] border-amber/30"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-20 size-80 rounded-full border-[36px] border-cobalt/30"
          />
          <div className="relative flex items-center gap-3">
            <LogoMark size={44} />
            <div className="leading-none">
              <p className="font-display text-xl font-bold">T-tracker</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-paper/70">
                by yenDigital
              </p>
            </div>
          </div>
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-ink/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-paper/90 backdrop-blur-md">
              <KeyRound className="size-3 text-amber" />
              Account Recovery
            </span>
            <p className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance">
              Regain access to your workspace securely.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/80">
              We take security seriously. Reset your credentials safely so you can resume tracking time, tickets, and team velocity without missing a beat.
            </p>
          </div>
          <p className="relative text-xs text-paper/60">
            © {new Date().getFullYear()} YenDigital. All rights reserved.
          </p>
        </div>

        {/* Right form panel */}
        {formContent}
      </div>
    </TiltCard>
  )
}
