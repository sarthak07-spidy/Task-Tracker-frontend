import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Briefcase,
  Building2,
  AlertCircle,
  KeyRound,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import TiltCard from './TiltCard'
import { LogoMark } from './Logo'
import { useAuth } from '../context/AuthContext'
import Spinner from './ui/Spinner'
import ForgotPasswordCard from './ForgotPasswordCard'

type Mode = 'login' | 'signup' | 'forgot'
const ease = [0.22, 1, 0.36, 1] as const

function Field({
  id,
  label,
  type,
  icon: Icon,
  autoComplete,
  trailing,
  value,
  onChange,
  required = true,
}: {
  id: string
  label: string
  type: string
  icon: typeof Mail
  autoComplete?: string
  trailing?: React.ReactNode
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <label htmlFor={id} className="group flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-paper-muted">
        {label}
      </span>
      <span className="flex items-center gap-3 rounded-xl border border-line bg-ink/60 px-4 py-3 transition-all focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(228,55,28,0.15)]">
        <Icon className="size-4 shrink-0 text-paper-muted transition-colors group-focus-within:text-brand" />
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-0 ring-0 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:outline-none focus:ring-0 focus:border-0 shadow-none"
          placeholder={label}
        />
        {trailing}
      </span>
    </label>
  )
}

export default function AuthCard({
  initialMode = 'login',
}: {
  initialMode?: Mode
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('')

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname ?? '/app/dashboard'

  function resetForm() {
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setDesignation('')
    setDepartment('')
    setError('')
  }

  function switchMode(m: Mode) {
    setMode(m)
    resetForm()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({
          email,
          password,
          firstName,
          lastName,
          designation: designation || undefined,
          department: department || undefined,
        })
      }
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error('Auth error:', err)
      const data = (err as { response?: { data?: unknown } })?.response?.data
      let msg = ''
      if (typeof data === 'string' && data.trim()) {
        msg = data.trim()
      } else if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>
        if (typeof d.message === 'string' && d.message.trim()) {
          msg = d.message
        } else if (typeof d.error === 'string' && d.error.trim()) {
          msg = d.error
        } else if (typeof d.title === 'string' && d.title.trim()) {
          msg = d.title
        } else if (d.errors && typeof d.errors === 'object') {
          msg = Object.values(d.errors as Record<string, string[]>)
            .flat()
            .join(' · ')
        }
      }

      if (!msg) {
        msg = (err as Error)?.message ?? 'Something went wrong'
      }

      // Friendly translation for 401 / bad credentials
      if (
        msg.includes('401') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('invalid email') ||
        msg.toLowerCase().includes('invalid password')
      ) {
        msg = 'Invalid email or password. Please check your credentials.'
      }

      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <TiltCard intensity={5} glare={false} className="w-full max-w-4xl">
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
            {mode === 'forgot' ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-ink/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-paper/90 backdrop-blur-md">
                  <KeyRound className="size-3 text-amber" />
                  Account Recovery
                </span>
                <p className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance">
                  Regain access to your workspace securely.
                </p>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/80">
                  Reset your credentials safely so you can resume tracking time, tickets, and team velocity without missing a beat.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance">
                  Your week, seen clearly for the first time.
                </p>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/80">
                  Join teams who stopped guessing and started tracking. No credit
                  card, no setup call — just a timer that finally keeps up.
                </p>
              </>
            )}
          </div>
          <p className="relative text-xs text-paper/60">
            © {new Date().getFullYear()} YenDigital. All rights reserved.
          </p>
        </div>

        {/* Right form panel */}
        <div className="p-7 sm:p-10 flex flex-col justify-center">
          {mode === 'forgot' ? (
            <ForgotPasswordCard
              compact
              initialEmail={email}
              onBackToLogin={() => switchMode('login')}
            />
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="relative grid grid-cols-2 rounded-full bg-ink/60 p-1"
              >
            <motion.span
              aria-hidden="true"
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-paper ${
                mode === 'login' ? 'left-1' : 'left-[calc(50%+0px)]'
              }`}
            />
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`relative z-10 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                  mode === m
                    ? 'text-ink'
                    : 'text-paper-muted hover:text-paper'
                }`}
              >
                {m === 'login' ? 'Login' : 'Sign up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={mode}
              onSubmit={onSubmit}
              initial={{
                opacity: 0,
                x: mode === 'login' ? -30 : 30,
                rotateY: mode === 'login' ? -12 : 12,
              }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{
                opacity: 0,
                x: mode === 'login' ? 30 : -30,
                rotateY: mode === 'login' ? 12 : -12,
              }}
              transition={{ duration: 0.45, ease }}
              style={{ transformStyle: 'preserve-3d' }}
              className="mt-8 flex flex-col gap-5"
            >
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {mode === 'login'
                    ? 'Welcome back'
                    : 'Create your account'}
                </h2>
                <p className="mt-1 text-sm text-paper-muted">
                  {mode === 'login'
                    ? 'Pick up your timeline where you left it.'
                    : 'Start tracking in under a minute.'}
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key={error}
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      x: [0, -6, 6, -4, 4, 0] 
                    }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/15 px-4 py-3.5 shadow-lg shadow-red-950/40"
                  >
                    <AlertCircle className="size-5 shrink-0 text-red-400" />
                    <span className="text-sm font-medium text-red-200">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      id="firstName"
                      label="First name"
                      type="text"
                      icon={User}
                      autoComplete="given-name"
                      value={firstName}
                      onChange={setFirstName}
                    />
                    <Field
                      id="lastName"
                      label="Last name"
                      type="text"
                      icon={User}
                      autoComplete="family-name"
                      value={lastName}
                      onChange={setLastName}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      id="designation"
                      label="Designation"
                      type="text"
                      icon={Briefcase}
                      value={designation}
                      onChange={setDesignation}
                      required={false}
                    />
                    <Field
                      id="department"
                      label="Department"
                      type="text"
                      icon={Building2}
                      value={department}
                      onChange={setDepartment}
                      required={false}
                    />
                  </div>
                </>
              )}

              <Field
                id="email"
                label="Email"
                type="email"
                icon={Mail}
                autoComplete="email"
                value={email}
                onChange={setEmail}
              />
              <Field
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={setPassword}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="text-paper-muted transition-colors hover:text-paper"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                }
              />

              {mode === 'login' ? (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-paper-muted">
                    <input
                      type="checkbox"
                      className="size-3.5 accent-brand"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="font-medium text-paper-muted hover:text-brand transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <label className="flex items-start gap-2 text-xs text-paper-muted">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 size-3.5 accent-brand"
                  />
                  <span>
                    I agree to the{' '}
                    <a
                      href="#"
                      className="text-paper underline-offset-2 hover:underline"
                    >
                      Terms
                    </a>{' '}
                    and{' '}
                    <a
                      href="#"
                      className="text-paper underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="group mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-paper shadow-[0_12px_40px_-12px_rgba(228,55,28,0.9)] disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    {mode === 'login' ? 'Log in' : 'Create account'}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-xs text-paper-muted">
                {mode === 'login'
                  ? 'New to T-tracker?'
                  : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() =>
                    switchMode(mode === 'login' ? 'signup' : 'login')
                  }
                  className="font-semibold text-paper underline-offset-4 hover:underline cursor-pointer"
                >
                  {mode === 'login' ? 'Create an account' : 'Log in'}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </TiltCard>
  )
}
