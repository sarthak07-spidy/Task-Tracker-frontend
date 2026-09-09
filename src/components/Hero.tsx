import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Play,
  Ticket,
} from 'lucide-react'
import { LogoMark } from './Logo'

const ease = [0.22, 1, 0.36, 1] as const

function FloatingCard({
  depth,
  className,
  children,
  mouseX,
  mouseY,
  delay = 0,
}: {
  depth: number
  className: string
  children: React.ReactNode
  mouseX: ReturnType<typeof useSpring>
  mouseY: ReturnType<typeof useSpring>
  delay?: number
}) {
  const tx = useTransform(mouseX, [-0.5, 0.5], [-depth * 40, depth * 40])
  const ty = useTransform(mouseY, [-0.5, 0.5], [-depth * 30, depth * 30])
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 30 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.1, delay, ease }}
      style={{ x: tx, y: ty, translateZ: depth * 120 }}
      className={`absolute glass rounded-2xl p-4 shadow-2xl shadow-ink/60 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mouseX = useSpring(rawX, { stiffness: 60, damping: 20 })
  const mouseY = useSpring(rawY, { stiffness: 60, damping: 20 })

  const sceneRotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10])
  const sceneRotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const textY = useTransform(scrollYProgress, [0, 1], [0, -160])
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 220])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 0.82])
  const sceneZ = useTransform(scrollYProgress, [0, 1], [0, -400])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      rawX.set(e.clientX / window.innerWidth - 0.5)
      rawY.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [rawX, rawY])

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-10"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-fade" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 [background:conic-gradient(from_180deg,transparent_0deg,rgba(228,55,28,0.25)_90deg,transparent_180deg,rgba(47,91,255,0.25)_270deg,transparent_360deg)] animate-spin-slow blur-3xl"
      />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-paper-muted"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-brand animate-pulse-ring" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          A yenDigital product
        </motion.span>

        <h1 className="mt-7 font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-balance sm:text-7xl lg:text-8xl">
          {['Every', 'ticket,'].map((w, i) => (
            <motion.span
              key={w}
              initial={{ opacity: 0, y: 40, rotateX: -40 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.1, ease }}
              className="mr-[0.25em] inline-block"
            >
              {w}
            </motion.span>
          ))}
          <br />
          <motion.span
            initial={{ opacity: 0, y: 40, rotateX: -40 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease }}
            className="inline-block text-gradient-brand"
          >
            finally on track.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease }}
          className="mt-7 max-w-xl text-base leading-relaxed text-paper-muted text-pretty sm:text-lg"
        >
          T-tracker assigns every ticket to the right person and keeps the
          whole conversation inside it, so nothing gets lost in email or chat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.75, ease }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/auth"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-paper shadow-[0_12px_40px_-10px_rgba(228,55,28,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-10px_rgba(228,55,28,0.9)] active:translate-y-0"
          >
            Get started free
          </Link>
          <a
            href="#story"
            className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors hover:bg-paper/10"
          >
            <Play className="size-4 fill-current" />
            Watch the story
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        style={{
          y: sceneY,
          scale: sceneScale,
          z: sceneZ,
          rotateX: sceneRotateX,
          rotateY: sceneRotateY,
          transformStyle: 'preserve-3d',
          perspective: 1200,
        }}
        className="relative z-0 mt-12 mb-16 h-[420px] w-full max-w-4xl preserve-3d sm:mt-16 sm:h-[360px]"
      >
        <FloatingCard
          depth={0.4}
          delay={0.9}
          mouseX={mouseX}
          mouseY={mouseY}
          className="left-1/2 top-1/2 w-[270px] -translate-x-1/2 -translate-y-1/2 sm:w-[330px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark size={34} />
              <div>
                <p className="text-xs text-paper-muted">Ticket #TT-248</p>
                <p className="text-sm font-semibold">Checkout not loading</p>
              </div>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber">
              in progress
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-paper/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-cobalt text-[10px] font-bold text-paper">
                M
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-paper-muted">
                  Assigned to
                </p>
                <p className="text-xs font-semibold">Maya Roy</p>
              </div>
            </div>
            <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
              High priority
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-paper-muted">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" /> 6 comments
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> 2 / 4 subtasks
            </span>
          </div>
        </FloatingCard>

        <FloatingCard
          depth={0.9}
          delay={1.1}
          mouseX={mouseX}
          mouseY={mouseY}
          className="left-[2%] top-0 w-[180px] sm:left-[6%] sm:top-[6%] sm:w-[200px]"
        >
          <div className="flex items-center gap-2 text-amber">
            <Ticket className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Assigned to you
            </p>
          </div>
          <p className="mt-2 font-display text-3xl font-bold">
            7 <span className="text-lg font-semibold text-paper-muted">tickets</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 flex-1 rounded-full bg-brand" />
            <span className="h-1.5 flex-1 rounded-full bg-amber" />
            <span className="h-1.5 flex-1 rounded-full bg-cobalt" />
            <span className="h-1.5 flex-1 rounded-full bg-paper/15" />
          </div>
          <p className="mt-1.5 text-[11px] text-paper-muted">
            2 urgent · 3 open · 2 review
          </p>
        </FloatingCard>

        <FloatingCard
          depth={0.7}
          delay={1.25}
          mouseX={mouseX}
          mouseY={mouseY}
          className="bottom-0 right-[2%] w-[220px] sm:bottom-[2%] sm:right-[5%] sm:w-[240px]"
        >
          <div className="flex items-center gap-2 text-cobalt">
            <MessageSquare className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Ticket chat
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7, duration: 0.5, ease }}
              className="flex items-start gap-2"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cobalt text-[9px] font-bold text-paper">
                M
              </span>
              <p className="rounded-2xl rounded-tl-sm bg-paper/10 px-3 py-1.5 text-xs leading-snug">
                Found it — the API key expired.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.2, duration: 0.5, ease }}
              className="flex items-start justify-end gap-2"
            >
              <p className="rounded-2xl rounded-tr-sm bg-brand px-3 py-1.5 text-xs leading-snug text-paper">
                Great, ship the fix today?
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7, duration: 0.4 }}
              className="flex items-center gap-1 pl-8 text-paper-muted"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    delay: i * 0.2,
                  }}
                  className="size-1.5 rounded-full bg-current"
                />
              ))}
            </motion.div>
          </div>
        </FloatingCard>
      </motion.div>

      <motion.a
        href="#story"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="relative z-10 mt-2 flex flex-col items-center gap-2 whitespace-nowrap text-xs font-medium uppercase tracking-[0.25em] text-paper-muted transition-colors hover:text-paper"
      >
        Swipe up for the story
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <ChevronDown className="size-5" />
        </motion.span>
      </motion.a>
    </section>
  )
}
