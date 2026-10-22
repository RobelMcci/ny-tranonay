import { m } from 'framer-motion'

/** Apparition douce au scroll. Respecte prefers-reduced-motion via <MotionConfig> du Layout. */
export default function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const Tag = m[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
    >
      {children}
    </Tag>
  )
}
