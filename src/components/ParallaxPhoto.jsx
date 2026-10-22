import { useRef } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import Photo from './Photo.jsx'

/** Photo qui glisse doucement à contre-sens du scroll (effet de profondeur). */
export default function ParallaxPhoto({ name, className = '', sizes, strength = 9, alt }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <m.div style={{ y }} className="absolute -inset-[12%]">
        <Photo name={name} sizes={sizes} alt={alt} className="h-full w-full object-cover" />
      </m.div>
    </div>
  )
}
