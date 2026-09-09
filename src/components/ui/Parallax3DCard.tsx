import { useState, useRef, useCallback, type ReactNode, type MouseEvent } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface Parallax3DCardProps {
  children: ReactNode
  className?: string
  intensity?: number // max tilt degrees, default 10
  glare?: boolean // dynamic specular glare reflection
  depthEffect?: boolean
}

export default function Parallax3DCard({
  children,
  className = '',
  intensity = 10,
  glare = true,
  depthEffect = true,
}: Parallax3DCardProps) {
  const { theme } = useTheme()
  const isCrazy = theme === 'crazy'
  const cardRef = useRef<HTMLDivElement | null>(null)

  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false })
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!isCrazy || !cardRef.current) return

      const card = cardRef.current
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Calculate normalized offsets (-1 to 1)
      const normX = Math.max(-1, Math.min(1, (x - centerX) / centerX))
      const normY = Math.max(-1, Math.min(1, (y - centerY) / centerY))

      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        setTilt({
          rx: -normY * intensity,
          ry: normX * intensity,
          gx: (x / rect.width) * 100,
          gy: (y / rect.height) * 100,
          active: true,
        })
      })
    },
    [intensity, isCrazy],
  )

  const handleMouseLeave = useCallback(() => {
    if (!isCrazy) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setTilt((prev) => ({ ...prev, rx: 0, ry: 0, active: false }))
  }, [isCrazy])

  if (!isCrazy) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-all duration-300 ease-out preserve-3d ${className}`}
      style={{
        transform: tilt.active
          ? `perspective(1200px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(8px)`
          : 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transformStyle: 'preserve-3d',
        transition: tilt.active
          ? 'transform 0.08s ease-out, box-shadow 0.25s ease'
          : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease',
      }}
    >
      {/* Specular Glare Overlay */}
      {glare && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] overflow-hidden transition-opacity duration-300"
          style={{
            opacity: tilt.active ? 0.35 : 0,
            background: `radial-gradient(circle 350px at ${tilt.gx.toFixed(1)}% ${tilt.gy.toFixed(1)}%, rgba(254, 240, 138, 0.4), rgba(245, 158, 11, 0.15) 35%, transparent 70%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Children content with 3D depth preserve */}
      <div
        className={depthEffect ? 'relative z-10 preserve-3d w-full h-full' : 'relative z-10 w-full h-full'}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  )
}
