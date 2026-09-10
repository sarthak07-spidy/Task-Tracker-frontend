import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, type LucideIcon } from 'lucide-react'
import TiltCard from './TiltCard'

const ease = [0.22, 1, 0.36, 1] as const

type StoryBlockProps = {
  id: string
  eyebrow: string
  icon: LucideIcon
  accent: 'brand' | 'cobalt'
  title: React.ReactNode
  body: string
  points: string[]
  visual: React.ReactNode
  reverse?: boolean
}

function StoryBlock({
  id,
  eyebrow,
  icon: Icon,
  accent,
  title,
  body,
  points,
  visual,
  reverse = false,
}: StoryBlockProps) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const cardRotateX = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [28, 0, 0, -18])
  const cardY = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [140, 0, 0, -120])
  const cardOpacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0])
  const bgY = useTransform(scrollYProgress, [0, 1], ['-20%', '20%'])

  const accentText = accent === 'brand' ? 'text-brand' : 'text-cobalt'
  const accentBg = accent === 'brand' ? 'bg-brand' : 'bg-cobalt'
  const accentGlow =
    accent === 'brand'
      ? 'from-brand/30 via-amber/10 to-transparent'
      : 'from-cobalt/30 via-amber/10 to-transparent'

  return (
    <section
      id={id}
      ref={ref}
      className="relative overflow-hidden px-6 py-28 sm:py-40"
    >
      <motion.div
        aria-hidden="true"
        style={{ y: bgY }}
        className={`pointer-events-none absolute inset-x-0 -top-1/4 h-[150%] bg-gradient-to-b ${accentGlow} opacity-70`}
      />
      <div
        className={`relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20 ${
          reverse ? 'lg:[&>*:first-child]:order-2' : ''
        }`}
      >
        <div>
          <motion.div
            initial={{ opacity: 0, x: reverse ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.8, ease }}
            className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] ${accentText}`}
          >
            <Icon className="size-4" />
            {eyebrow}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="mt-6 max-w-lg text-base leading-relaxed text-paper-muted text-pretty sm:text-lg"
          >
            {body}
          </motion.p>

          <ul className="mt-8 flex flex-col gap-4">
            {points.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease }}
                className="flex items-start gap-3 text-sm sm:text-base"
              >
                <span
                  className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${accentBg}`}
                />
                <span className="text-paper/90">{p}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div style={{ perspective: 1600 }}>
          <motion.div
            style={{
              rotateX: cardRotateX,
              y: cardY,
              opacity: cardOpacity,
              transformStyle: 'preserve-3d',
            }}
          >
            <TiltCard intensity={8} className="w-full">
              <div className="glass relative overflow-hidden rounded-3xl p-6 shadow-2xl shadow-ink/70 sm:p-8">
                {visual}
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ChaosVisual() {
  const bars = [
    { w: 38, x: 4, y: 0, c: 'bg-red-500/70' },
    { w: 22, x: 54, y: 1, c: 'bg-paper/25' },
    { w: 30, x: 18, y: 2, c: 'bg-amber/60' },
    { w: 16, x: 68, y: 3, c: 'bg-red-500/40' },
    { w: 44, x: 8, y: 4, c: 'bg-paper/20' },
    { w: 20, x: 52, y: 5, c: 'bg-cobalt/50' },
    { w: 26, x: 62, y: 6, c: 'bg-paper/25' },
  ]
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper-muted">
          Sprint 2 · Scattered Tasks
        </p>
        <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
          3 Overdue Tickets
        </span>
      </div>
      <div className="relative mt-6 h-[240px]">
        {bars.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleX: 0, rotate: 0 }}
            whileInView={{ opacity: 1, scaleX: 1, rotate: (i % 2 ? 1 : -1) * (2 + i) }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease }}
            style={{ width: `${b.w}%`, left: `${b.x}%`, top: `${b.y * 34}px` }}
            className={`absolute h-6 origin-left rounded-md ${b.c}`}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 1, ease }}
          className="absolute -bottom-2 right-0 rounded-xl border border-red-500/40 bg-ink px-3.5 py-2.5 text-xs shadow-xl"
        >
          <p className="font-semibold text-red-400">Blocked Ticket #18</p>
          <p className="text-paper-muted mt-0.5">No assignee · Due 2 days ago · Zero updates</p>
        </motion.div>
      </div>
    </div>
  )
}

function OrderVisual() {
  const rows = [
    { label: 'Auth & Security', w: 100, c: 'bg-emerald-500', status: 'Completed', color: '#22c55e' },
    { label: 'API Status Engine', w: 75, c: 'bg-purple-500', status: 'In Review', color: '#a855f7' },
    { label: 'UI Dashboard', w: 55, c: 'bg-amber-500', status: 'In Progress', color: '#f59e0b' },
    { label: 'Bug Ticket #14', w: 25, c: 'bg-blue-500', status: 'Open', color: '#3b82f6' },
  ]
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper-muted">
          Active Sprint · Task Pipeline
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <CheckCircle2 className="size-3" /> 100% Tracked
        </span>
      </div>
      <div className="mt-6 flex flex-col gap-3.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-medium text-paper sm:text-sm truncate">
              {r.label}
            </span>
            <div className="h-6 flex-1 overflow-hidden rounded-md bg-paper/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${r.w}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 + i * 0.15, ease }}
                className={`h-full rounded-md ${r.c}`}
              />
            </div>
            <span
              className="text-[10px] sm:text-[11px] font-semibold shrink-0 w-20 text-right"
              style={{ color: r.color }}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 1, ease }}
        className="mt-6 flex items-center justify-between rounded-2xl bg-ink/70 border border-emerald-500/20 p-4"
      >
        <div>
          <p className="text-[11px] text-paper-muted uppercase tracking-wider">Ticket #10 · In Review</p>
          <p className="font-display text-base sm:text-lg font-bold text-emerald-400">Ready for Assigner Review</p>
        </div>
        <Link
          to="/auth"
          className="rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-paper transition-transform hover:scale-105 hover:bg-emerald-500 shadow-md shadow-emerald-950/40"
        >
          Review & Complete ✓
        </Link>
      </motion.div>
    </div>
  )
}

export default function ProblemSolution() {
  return (
    <>
      <StoryBlock
        id="problem"
        eyebrow="The Challenge"
        icon={AlertTriangle}
        accent="brand"
        title={
          <>
            Tasks get lost.
            <span className="text-brand"> Deadlines slip into chaos.</span>
          </>
        }
        body="Teams juggle tasks across chats, spreadsheets, and emails. Without a structured workflow, nobody knows who owns what, tickets get blocked in silence, and deliverables finish without review or accountability."
        points={[
          'Unclear ownership: Tasks assigned verbally or in chats vanish without a trace.',
          'Zero progress transparency: Is it In Progress, stuck, or ready for review? Nobody knows.',
          'Unverified completion: Work gets marked "done" without manager review or logged hours.',
        ]}
        visual={<ChaosVisual />}
      />
      <StoryBlock
        id="solution"
        eyebrow="The Solution"
        icon={CheckCircle2}
        accent="cobalt"
        reverse
        title={
          <>
            One unified pipeline.
            <span className="text-gradient-brand"> Complete clarity.</span>
          </>
        }
        body="T-Tracker streamlines your entire project workflow from assignment to review. Assign tickets with priorities, track real-time status transitions, log actual hours, and close tasks with structured manager reviews."
        points={[
          'Structured ticket lifecycle: Open ➔ In Progress ➔ In Review ➔ Completed.',
          'Assigner review gate: Verify deliverables and add completion remarks before tickets close.',
          'In-ticket discussion & time tracking: Keep conversations, blockers, and logged hours in one place.',
        ]}
        visual={<OrderVisual />}
      />
    </>
  )
}
