import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

const format = (n) => Math.round(n).toLocaleString('fr-FR')

/** Nombre qui s'incrémente à l'apparition. Le HTML contient la valeur finale (lisible sans JS, bon pour le SEO). */
export default function CountUp({ to, suffix = '', duration = 1.6 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })

  useEffect(() => {
    const el = ref.current
    if (!inView || !el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      el.textContent = `${format(to * (1 - (1 - t) ** 3))}${suffix}` // décélération cubique
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    el.textContent = `0${suffix}`
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, to, suffix, duration])

  return <span ref={ref}>{format(to)}{suffix}</span>
}
