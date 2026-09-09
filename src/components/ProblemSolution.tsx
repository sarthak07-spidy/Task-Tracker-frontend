import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
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
    { w: 34, x: 4, y: 0, c: 'bg-brand/70' },
    { w: 18, x: 58, y: 1, c: 'bg-paper/25' },
    { w: 26, x: 22, y: 2, c: 'bg-amber/60' },
    { w: 12, x: 70, y: 3, c: 'bg-brand/40' },
    { w: 40, x: 10, y: 4, c: 'bg-paper/20' },
    { w: 16, x: 48, y: 5, c: 'bg-cobalt/50' },
    { w: 22, x: 66, y: 6, c: 'bg-paper/25' },
  ]
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper-muted">
          Monday · 7 sources
        </p>
        <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
          4.2h missing
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
          className="absolute -bottom-2 right-0 rounded-xl border border-brand/40 bg-ink px-3 py-2 text-xs shadow-lg"
        >
          <p className="font-semibold text-brand">Invoice mismatch</p>
          <p className="text-paper-muted">Client billed 31h · logged 26.8h</p>
        </motion.div>
      </div>
    </div>
  )
}

function OrderVisual() {
  const rows = [
    { label: 'Design review', w: 30, c: 'bg-brand' },
    { label: 'Frontend build', w: 58, c: 'bg-amber' },
    { label: 'Client call', w: 18, c: 'bg-cobalt' },
    { label: 'QA & handoff', w: 40, c: 'bg-paper/70' },
  ]
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper-muted">
          Monday · one timeline
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-cobalt/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cobalt">
          <CheckCircle2 className="size-3" /> 100% captured
        </span>
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-4">
            <span className="w-28 shrink-0 text-xs text-paper-muted sm:text-sm">
              {r.label}
            </span>
            <div className="h-7 flex-1 overflow-hidden rounded-md bg-paper/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${r.w}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 + i * 0.15, ease }}
                className={`h-full rounded-md ${r.c}`}
              />
            </div>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 1, ease }}
        className="mt-6 flex items-end justify-between rounded-2xl bg-ink/60 p-4"
      >
        <div>
          <p className="text-xs text-paper-muted">Ready to invoice</p>
          <p className="font-display text-2xl font-bold">7h 20m</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-paper px-4 py-2 text-xs font-semibold text-ink transition-transform hover:scale-105"
        >
          Send invoice
        </button>
      </motion.div>
    </div>
  )
}

export default function ProblemSolution() {
  return (
    <>
      <StoryBlock
        id="problem"
        eyebrow="The problem"
        icon={AlertTriangle}
        accent="brand"
        title={
          <>
            Time leaks through
            <span className="text-brand"> every crack.</span>
          </>
        }
        body="Teams juggle timers, spreadsheets, chat threads and memory. By Friday nobody knows where the week actually went, and clients get billed on guesses."
        points={[
          'Hours vanish between tools that never talk to each other.',
          'Timesheets get filled in from memory, days later.',
          'Invoices drift from reality and trust erodes.',
        ]}
        visual={<ChaosVisual />}
      />
      <StoryBlock
        id="solution"
        eyebrow="The solution"
        icon={CheckCircle2}
        accent="cobalt"
        reverse
        title={
          <>
            One timeline.
            <span className="text-gradient-brand"> Zero guesswork.</span>
          </>
        }
        body="T-tracker captures work as it happens, links every minute to a project and a person, and turns it into reports and invoices in one tap."
        points={[
          'Start a timer anywhere; it follows you across devices.',
          'Live team view shows who is on what, right now.',
          'Invoices generate themselves from verified hours.',
        ]}
        visual={<OrderVisual />}
      />
    </>
  )
}
