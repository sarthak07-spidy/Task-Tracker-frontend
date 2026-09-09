import { useScroll } from 'framer-motion'
import { useEffect, useRef } from 'react'

const VIDEO_SRC = '/assets/story-video.mp4'
// Scroll distance (in viewport heights) that maps to the full video duration.
const SCROLL_LENGTH_VH = 500

export default function ScrollVideo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let duration = 0
    let target = scrollYProgress.get()
    let current = target
    let frame = 0

    const onMeta = () => {
      duration = video.duration
      video.currentTime = current * duration
    }
    if (video.readyState >= 1) onMeta()
    video.addEventListener('loadedmetadata', onMeta)

    // Ensure the browser never autoplays; scroll is the only controller.
    video.pause()

    const unsubscribe = scrollYProgress.on('change', (v) => {
      target = v
    })

    const tick = () => {
      if (duration > 0) {
        current += (target - current) * 0.14
        if (Math.abs(target - current) < 0.0004) current = target
        const time = current * duration
        if (!video.seeking && Math.abs(video.currentTime - time) > 0.008) {
          video.currentTime = time
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
      video.removeEventListener('loadedmetadata', onMeta)
    }
  }, [scrollYProgress])

  return (
    <section
      id="story"
      ref={containerRef}
      aria-label="T-tracker story"
      style={{ height: `${SCROLL_LENGTH_VH}vh` }}
      className="relative bg-ink"
    >
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  )
}
