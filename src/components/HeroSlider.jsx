import { useEffect, useState } from 'react'
import Photo from './Photo.jsx'
import WaveDivider from './WaveDivider.jsx'

const slides = [
  { slot: 'hero.1', caption: 'Le jour · piscine et jardin' },
  { slot: 'hero.2', caption: 'Au crépuscule · la piscine s’illumine' },
  { slot: 'hero.3', caption: 'La nuit · cinéma en plein air' },
]
const DELAY = 6500

/**
 * Hero plein écran : trois ambiances (jour, crépuscule, nuit) en fondu enchaîné avec un lent zoom.
 * Seule la 1ʳᵉ photo est chargée tout de suite ; les autres arrivent après le premier affichage.
 */
export default function HeroSlider({ children }) {
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    const wake = setTimeout(() => {
      setReduced(query.matches)
      setReady(true)
    }, 1800)
    return () => {
      query.removeEventListener('change', onChange)
      clearTimeout(wake)
    }
  }, [])

  useEffect(() => {
    if (!ready || reduced) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), DELAY)
    return () => clearInterval(timer)
  }, [ready, reduced])

  return (
    <section className="relative isolate flex min-h-[94svh] items-end overflow-hidden bg-[#1c140f] text-white">
      {slides.map((slide, i) => {
        if (i > 0 && !ready) return null
        return (
          <div
            key={slide.slot}
            aria-hidden="true"
            className={`absolute inset-0 -z-20 transition-opacity duration-[1600ms] ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
          >
            <Photo name={slide.slot} priority={i === 0} sizes="100vw" alt="" className="kenburns h-full w-full object-cover" />
          </div>
        )
      })}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#140d09]/90 via-[#140d09]/35 to-[#140d09]/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#140d09]/60 via-transparent to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-32 sm:px-6 lg:pb-36">{children}</div>

      <div className="absolute bottom-24 right-4 hidden items-center gap-3 sm:flex lg:bottom-32 lg:right-8" aria-hidden="true">
        <span className="text-xs font-semibold tracking-wide text-white/85">{slides[index].caption}</span>
        <span className="flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.slot}
              type="button"
              tabIndex={-1}
              onClick={() => setIndex(i)}
              className={`h-1.5 overflow-hidden rounded-full bg-white/35 transition-all ${i === index ? 'w-10' : 'w-4'}`}
            >
              {i === index && !reduced && ready && <span key={index} className="progress-fill block h-full bg-white" style={{ animationDuration: `${DELAY}ms` }} />}
            </button>
          ))}
        </span>
      </div>

      <WaveDivider />
    </section>
  )
}
