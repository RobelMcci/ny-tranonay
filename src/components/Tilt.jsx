import { m, useMotionValue, useSpring, useTransform } from 'framer-motion'

/** Inclinaison 3D qui suit la souris (ignorée au toucher). */
export default function Tilt({ children, className = '', max = 7 }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 220, damping: 22 })
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max * 0.7, -max * 0.7]), { stiffness: 220, damping: 22 })

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <m.div onPointerMove={onMove} onPointerLeave={reset} style={{ rotateX, rotateY, transformPerspective: 900 }} className={className}>
      {children}
    </m.div>
  )
}
