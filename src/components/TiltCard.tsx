import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { PointerEvent, ReactNode } from 'react'

type TiltCardProps = {
  children: ReactNode
  className?: string
  intensity?: number
  glare?: boolean
}

export default function TiltCard({
  children,
  className = '',
  intensity = 12,
  glare = true,
}: TiltCardProps) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const sx = useSpring(x, { stiffness: 160, damping: 20 })
  const sy = useSpring(y, { stiffness: 160, damping: 20 })

  const rotateX = useTransform(sy, [0, 1], [intensity, -intensity])
  const rotateY = useTransform(sx, [0, 1], [-intensity, intensity])
  const glareX = useTransform(sx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(sy, [0, 1], ['0%', '100%'])

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width)
    y.set((e.clientY - rect.top) / rect.height)
  }

  function onLeave() {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <div style={{ perspective: 1400 }} className={className}>
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full w-full will-change-transform"
      >
        {children}
        {glare && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          >
            <motion.div
              style={{ left: glareX, top: glareY }}
              className="absolute size-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(246,243,238,0.14),transparent_55%)] mix-blend-screen"
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}
