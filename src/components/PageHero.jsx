import { useRef } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import Photo from './Photo.jsx'
import WaveDivider from './WaveDivider.jsx'

/** Bandeau de tête de page : photo en parallaxe lente, titre H1, accroche et boutons. */
export default function PageHero({ eyebrow, title, lead, photo, children, waveFill }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])

  return (
    <section ref={ref} className="relative isolate flex min-h-[56svh] items-end overflow-hidden bg-[#1c140f] text-white">
      <m.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0 -z-20">
        <Photo name={photo} priority sizes="100vw" alt="" className="kenburns h-full w-full object-cover" />
      </m.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#140d09]/90 via-[#140d09]/40 to-[#140d09]/20" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:pb-28">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-[#FDBA74]">{eyebrow}</p>
        <h1 className="anim-rise mt-3 max-w-3xl text-white" style={{ animationDelay: '0.1s' }}>{title}</h1>
        <p className="anim-rise mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg" style={{ animationDelay: '0.22s' }}>{lead}</p>
        {children && <div className="anim-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '0.34s' }}>{children}</div>}
      </div>
      <WaveDivider fill={waveFill} />
    </section>
  )
}
