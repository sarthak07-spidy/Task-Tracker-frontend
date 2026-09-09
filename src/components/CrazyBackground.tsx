import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseVx: number
  baseVy: number
  size: number
  color: string
  alpha: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  life: number
  maxLife: number
}

interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  color: string
}

export default function CrazyBackground() {
  const { theme } = useTheme()
  const isCrazy = theme === 'crazy'
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!isCrazy) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    function handleResize() {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Mouse coordinates with smoothing
    let mouseX = -1000
    let mouseY = -1000
    let mouseIsDown = false

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    function onMouseLeave() {
      mouseX = -1000
      mouseY = -1000
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    // ─── Click Shockwaves & Sparks System ─────────────────────────────────────
    const shockwaves: Shockwave[] = []
    const sparks: Spark[] = []

    const clickColors = [
      '#f59e0b', // Champagne gold
      '#fbbf24', // Luminous amber yellow
      '#fef08a', // Pale golden yellow
      '#eab308', // Radiant sun gold
      '#f1f5f9', // Soft platinum silver
    ]

    function onClick(e: MouseEvent) {
      const clickX = e.clientX
      const clickY = e.clientY

      // 1. Trigger two concentric chromatic shockwaves
      shockwaves.push({
        x: clickX,
        y: clickY,
        radius: 5,
        maxRadius: Math.min(width, height) * 0.42,
        alpha: 0.9,
        color: clickColors[Math.floor(Math.random() * clickColors.length)],
      })

      shockwaves.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.min(width, height) * 0.32,
        alpha: 0.7,
        color: '#ffffff',
      })

      // 2. Blast nearby particles outward with physics explosion impulse
      const blastRadius = 320
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = p.x - clickX
        const dy = p.y - clickY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < blastRadius && dist > 1) {
          const force = (1 - dist / blastRadius) * 22
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }
      }

      // 3. Spawn 24 energetic radiant sparks
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 8 + 3
        const maxLife = Math.random() * 35 + 25
        sparks.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 1.5,
          alpha: 1,
          color: clickColors[Math.floor(Math.random() * clickColors.length)],
          life: 0,
          maxLife,
        })
      }
    }
    window.addEventListener('click', onClick)

    // Scroll interaction
    let scrollY = window.scrollY
    let lastScrollY = scrollY
    let scrollVelocity = 0

    function onScroll() {
      const currentScroll = window.scrollY
      scrollVelocity = (currentScroll - lastScrollY) * 0.4
      lastScrollY = currentScroll
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ─── Particle Constellation Palette (Soft Warm Champagne, Yellow & Silver) ──
    const particlePalette = [
      '#f59e0b', // Warm Amber Gold
      '#fbbf24', // Champagne Yellow
      '#fef08a', // Pale Golden Mist
      '#cbd5e1', // Slate Silver Grey
      '#e2e8f0', // Metallic Platinum
      '#eab308', // Radiant Champagne
      '#d97706', // Soft Honey Bronze
    ]

    const NUM_PARTICLES = Math.floor(Math.min(width, 1600) * 0.08)
    const particles: Particle[] = []

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const baseVx = (Math.random() - 0.5) * 0.9
      const baseVy = (Math.random() - 0.5) * 0.8
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        size: Math.random() * 2.8 + 1.4,
        color: particlePalette[Math.floor(Math.random() * particlePalette.length)],
        alpha: Math.random() * 0.55 + 0.35,
      })
    }

    // ─── Render Loop ──────────────────────────────────────────────────────────
    let time = 0

    function render() {
      time += 0.016
      scrollVelocity *= 0.92 // Decay scroll kick

      ctx!.clearRect(0, 0, width, height)

      // 1. Sophisticated Warm Studio Gradient (Soft Champagne Gold + Mineral Grey Glow)
      const grad = ctx!.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.6) * 120,
        height * 0.4 + Math.cos(time * 0.5) * 80,
        40,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      )
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.09)') // Soft champagne gold
      grad.addColorStop(0.35, 'rgba(234, 179, 8, 0.06)') // Warm golden ambient
      grad.addColorStop(0.7, 'rgba(148, 163, 184, 0.05)') // Soft slate graphite
      grad.addColorStop(1, 'transparent')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, width, height)

      // 2. Update & Draw Particles with Physics Field
      const maxConnectDist = 115
      const mouseInfluenceRadius = 160

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Organic horizontal & vertical wave oscillation
        p.vx += Math.sin(time * 1.2 + p.y * 0.01) * 0.015
        p.vy += Math.cos(time * 1.0 + p.x * 0.01) * 0.015

        // Influence of scroll velocity
        p.vy += scrollVelocity * 0.04

        // Mouse hover interaction: gentle repulsion & spring deflection
        const dxMouse = p.x - mouseX
        const dyMouse = p.y - mouseY
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)

        if (distMouse < mouseInfluenceRadius && distMouse > 1) {
          const factor = (1 - distMouse / mouseInfluenceRadius) * 0.8
          p.vx += (dxMouse / distMouse) * factor
          p.vy += (dyMouse / distMouse) * factor
        }

        // Return velocity smoothly back to natural drift
        p.vx += (p.baseVx - p.vx) * 0.03
        p.vy += (p.baseVy - p.vy) * 0.03

        p.x += p.vx
        p.y += p.vy

        // Wrap around boundaries
        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        // Draw particle dot
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = p.alpha
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      // 3. Draw Constellation Network Filaments
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * 0.28
            ctx!.strokeStyle = p1.color
            ctx!.globalAlpha = lineAlpha
            ctx!.lineWidth = 0.85
            ctx!.beginPath()
            ctx!.moveTo(p1.x, p1.y)
            ctx!.lineTo(p2.x, p2.y)
            ctx!.stroke()
          }
        }
      }
      ctx!.globalAlpha = 1

      // 4. Update & Draw Shockwaves on Click
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i]
        sw.radius += 8.5
        sw.alpha *= 0.94

        ctx!.strokeStyle = sw.color
        ctx!.globalAlpha = sw.alpha
        ctx!.lineWidth = Math.max(1, (1 - sw.radius / sw.maxRadius) * 4)
        ctx!.beginPath()
        ctx!.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx!.stroke()

        if (sw.alpha < 0.02 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1)
        }
      }
      ctx!.globalAlpha = 1

      // 5. Update & Draw Sparks on Click
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i]
        sp.x += sp.vx
        sp.y += sp.vy
        sp.vx *= 0.95
        sp.vy *= 0.95
        sp.life++
        sp.alpha = Math.max(0, 1 - sp.life / sp.maxLife)

        ctx!.fillStyle = sp.color
        ctx!.globalAlpha = sp.alpha
        ctx!.beginPath()
        ctx!.arc(sp.x, sp.y, sp.size * sp.alpha, 0, Math.PI * 2)
        ctx!.fill()

        if (sp.life >= sp.maxLife || sp.alpha <= 0.02) {
          sparks.splice(i, 1)
        }
      }
      ctx!.globalAlpha = 1

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isCrazy])

  if (!isCrazy) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
