import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

/**
 * CrazyCursor — Premium magnetic cursor for CrazyYenner theme.
 *
 * Architecture:
 * - Dot:   follows cursor instantly (0 lag) — feels responsive
 * - Ring:  follows with spring physics — feels magnetic & alive
 * - Glow:  large soft radial gradient blob that lags even more — ambient depth
 *
 * All transforms are applied directly via requestAnimationFrame to avoid
 * React re-renders entirely. The component only mounts/unmounts with theme.
 */
export default function CrazyCursor() {
  const { theme } = useTheme()
  const isCrazy = theme === 'crazy'

  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const isHoveringRef = useRef(false)

  useEffect(() => {
    if (!isCrazy) return

    // Hide the native cursor globally while this component is active
    document.documentElement.style.cursor = 'none'

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2

    // Spring-damped followers
    let ringX = mouseX
    let ringY = mouseY
    let glowX = mouseX
    let glowY = mouseY

    // Spring constants (0–1, higher = faster catch-up)
    const RING_STIFFNESS = 0.14
    const GLOW_STIFFNESS = 0.055

    let rafId: number

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    function onMouseEnterInteractive() {
      isHoveringRef.current = true
    }
    function onMouseLeaveInteractive() {
      isHoveringRef.current = false
    }

    // Track interactive elements (links, buttons, inputs, textareas, selects)
    function attachInteractiveListeners() {
      const interactives = document.querySelectorAll<HTMLElement>(
        'a, button, input, textarea, select, [role="button"], [tabindex]'
      )
      interactives.forEach((el) => {
        el.addEventListener('mouseenter', onMouseEnterInteractive)
        el.addEventListener('mouseleave', onMouseLeaveInteractive)
      })
      return interactives
    }

    // Re-attach on DOM mutations so dynamically added elements are picked up
    let interactives = attachInteractiveListeners()

    const observer = new MutationObserver(() => {
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnterInteractive)
        el.removeEventListener('mouseleave', onMouseLeaveInteractive)
      })
      interactives = attachInteractiveListeners()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    function loop() {
      // Spring physics — lerp toward target each frame
      ringX += (mouseX - ringX) * RING_STIFFNESS
      ringY += (mouseY - ringY) * RING_STIFFNESS
      glowX += (mouseX - glowX) * GLOW_STIFFNESS
      glowY += (mouseY - glowY) * GLOW_STIFFNESS

      const hovering = isHoveringRef.current

      // Dot — instant, always centered on cursor
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(${hovering ? 0.4 : 1})`
      }

      // Ring — spring-follow, scale up on hover
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) scale(${hovering ? 1.8 : 1})`
        ringRef.current.style.opacity = hovering ? '0.55' : '0.7'
        ringRef.current.style.borderColor = hovering ? '#fbbf24' : '#f59e0b'
      }

      // Glow blob — slowest follower, ambient depth
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`
      }

      rafId = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMouseMove)
    rafId = requestAnimationFrame(loop)

    return () => {
      document.documentElement.style.cursor = ''
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnterInteractive)
        el.removeEventListener('mouseleave', onMouseLeaveInteractive)
      })
      observer.disconnect()
    }
  }, [isCrazy])

  if (!isCrazy) return null

  return (
    <>
      {/* Ambient glow blob — slowest, largest, most diffuse */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 50%, transparent 72%)',
          pointerEvents: 'none',
          zIndex: 9998,
          willChange: 'transform',
          transform: 'translate(-9999px, -9999px)',
        }}
      />

      {/* Ring — spring-follow with border, scales on hover */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1.5px solid #f59e0b',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform, opacity, border-color',
          transition: 'border-color 0.2s ease, opacity 0.2s ease, transform 0.15s ease',
          transform: 'translate(-9999px, -9999px)',
          boxShadow: '0 0 12px rgba(245,158,11,0.3), inset 0 0 6px rgba(245,158,11,0.08)',
        }}
      />

      {/* Dot — instant response, amber filled */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#fbbf24',
          pointerEvents: 'none',
          zIndex: 10000,
          willChange: 'transform',
          transform: 'translate(-9999px, -9999px)',
          boxShadow: '0 0 8px #f59e0b, 0 0 16px rgba(245,158,11,0.5)',
        }}
      />
    </>
  )
}
