import { m, useScroll, useSpring } from 'framer-motion'

/** Fine barre de progression de lecture en haut de page. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })
  return (
    <m.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-[#C2410C] via-[#D97706] to-[#047857]"
      aria-hidden="true"
    />
  )
}
