import { useEffect, useMemo, useRef, useState } from 'react'
import { m, useMotionTemplate, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { prices, roomHours } from '../data/site.js'
import { formatAr } from '../lib/quote.js'
import { roomHourShort } from '../lib/rooms.js'
import Photo from './Photo.jsx'
import { MoonIcon, SunIcon } from './Icons.jsx'

// Les horaires 8h30 / 18h / 9h sont ceux des vraies formules de privatisation.
const stages = [
  {
    time: '8h30',
    title: 'Le site est à vous',
    text: 'La journée de privatisation commence : piscine, baby-foot, jeux vidéo, simulateur de course, water gun et jeux de société, rien que pour votre groupe.',
    slot: 'journee.1',
  },
  {
    time: 'Midi',
    title: 'Grillades et tables dressées',
    text: `Barbecue sur place, repas sur commande (plat du jour ${formatAr(prices.meals.platDuJour)}, plat complet ${formatAr(prices.meals.platComplet)}) ou nourriture apportée de l’extérieur : boissons sur place.`,
    slot: 'journee.2',
  },
  {
    time: '18h',
    title: 'Le soleil tombe, la fête change de rythme',
    text: 'La journée se termine à 18h et la nuitée commence. Les lumières s’allument autour de la piscine et du jardin.',
    slot: 'journee.3',
  },
  {
    time: 'Soirée',
    title: 'Karaoké, dancing et jeux de lumière',
    text: 'La grande salle prend vie : sonorisation JBL, jeux de lumière, karaoké et dancing, baby-foot et jeux vidéo pour prolonger la soirée.',
    slot: 'journee.4',
  },
  {
    time: 'Nuit',
    title: 'Cinéma sous les étoiles',
    text: 'Un grand écran dans le jardin, face à la piscine éclairée : le film commence, allongé sur la pelouse.',
    slot: 'journee.5',
  },
  {
    time: 'Au réveil',
    title: 'On dort sur place',
    text: `Chambres climatisées avec eau chaude, wifi et terrasse privée, sur un site surveillé. La nuitée de privatisation se termine à 9h, le check-out des chambres est à ${roomHourShort(roomHours.checkOut)}.`,
    slot: 'journee.6',
  },
]

// Étoiles déterministes (même rendu côté serveur et client).
const stars = (() => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  return Array.from({ length: 46 }, () => ({ x: rand() * 100, y: rand() * 55, r: 1 + rand() * 1.6, d: rand() * 3 }))
})()

// Matin → midi → fin d'après-midi → crépuscule → nuit → nuit noire → aube.
const skyTop = ['#9BD7F5', '#4FB3EA', '#F59E5B', '#6B3FA0', '#1B1740', '#0F0E2B', '#F4A98B']
const skyBottom = ['#FDE7C2', '#BFE6FA', '#FBD38D', '#F08A6A', '#4B2E7A', '#241A55', '#FFE1B8']
const hills = ['#2F8F5F', '#1F7A4D', '#1A5C3C', '#123D2A', '#0A2118', '#07160F', '#2A7F55']
const keyframes = [0, 0.22, 0.46, 0.62, 0.78, 0.9, 1]

// Progression 0 → 1 entre deux bornes (hors bornes : 0 ou 1).
const ramp = (v, from, to) => Math.min(1, Math.max(0, (v - from) / (to - from)))

function Timeline({ active }) {
  return (
    <ol className="flex gap-2 lg:flex-col lg:gap-3" aria-hidden="true">
      {stages.map((s, i) => (
        <li key={s.time} className="flex items-center gap-2">
          <span className={`h-2.5 rounded-full transition-all duration-500 ${i === active ? 'w-8 bg-white' : 'w-2.5 bg-white/40'}`} />
          <span className={`hidden text-xs font-semibold tracking-wide transition-opacity lg:inline ${i === active ? 'text-white' : 'text-white/50'}`}>
            {s.time}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Scene({ progress, active }) {
  const top = useTransform(progress, keyframes, skyTop)
  const bottom = useTransform(progress, keyframes, skyBottom)
  const hill = useTransform(progress, keyframes, hills)
  const sky = useMotionTemplate`linear-gradient(to bottom, ${top}, ${bottom})`
  const sunX = useTransform(progress, [0, 0.62, 0.92, 1], ['76%', '88%', '18%', '22%'])
  const sunY = useTransform(progress, [0, 0.25, 0.62, 0.92, 1], ['26%', '12%', '66%', '74%', '50%'])
  const sunOpacity = useTransform(progress, (v) => Math.max(1 - ramp(v, 0.55, 0.7), ramp(v, 0.92, 1)))
  const moonX = useTransform(progress, [0.62, 1], ['20%', '84%'])
  const moonY = useTransform(progress, [0.62, 0.85, 1], ['70%', '20%', '10%'])
  const moonOpacity = useTransform(progress, (v) => ramp(v, 0.62, 0.78) * (1 - ramp(v, 0.92, 1)))
  const starsOpacity = useTransform(progress, (v) => ramp(v, 0.64, 0.86) * (1 - ramp(v, 0.92, 1)))

  return (
    <>
      <m.div className="absolute inset-0" style={{ background: sky }} />
      <m.div className="absolute inset-0" style={{ opacity: starsOpacity }} aria-hidden="true">
        {stars.map((s) => (
          <span
            key={`${s.x}-${s.y}`}
            className="absolute rounded-full bg-white animate-pulse"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, animationDelay: `${s.d}s` }}
          />
        ))}
      </m.div>
      <m.div
        className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFE9A8] shadow-[0_0_80px_30px_rgba(255,214,120,0.55)] sm:h-28 sm:w-28"
        style={{ left: sunX, top: sunY, opacity: sunOpacity }}
        aria-hidden="true"
      />
      <m.div
        className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5F3FF] shadow-[0_0_60px_18px_rgba(199,210,254,0.35)] sm:h-20 sm:w-20"
        style={{ left: moonX, top: moonY, opacity: moonOpacity }}
        aria-hidden="true"
      />
      <svg className="absolute inset-x-0 bottom-0 h-[38%] w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <m.path d="M0 210c180-70 330-90 520-40s330 70 520 10 290-50 400-10v150H0Z" style={{ fill: hill }} />
      </svg>
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur sm:left-6 sm:top-6">
        {active < 3 || active === 5 ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
        {stages[active].time}
      </div>
    </>
  )
}

export default function DayNight() {
  const sectionRef = useRef(null)
  const [active, setActive] = useState(0)
  const [reduced, setReduced] = useState(false)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.max(0, Math.min(stages.length - 1, Math.floor(v * stages.length))))
  })

  // Tout le texte est dans le HTML (lecteurs d'écran, moteurs de recherche), la scène animée est décorative.
  const textList = useMemo(
    () => (
      <ol className="sr-only">
        {stages.map((s) => (
          <li key={s.time}>
            <h3>{s.time} — {s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    ),
    [],
  )

  if (reduced) {
    return (
      <section className="bg-gradient-to-b from-[#4FB3EA] via-[#6B3FA0] to-[#0A0F24] py-16 text-white" aria-labelledby="jour-titre">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="eyebrow !text-[#FDE68A]">Une journée à Tranonay</p>
          <h2 id="jour-titre" className="mt-2 text-white">De l’aube à la nuit, tout est prévu</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-2">
            {stages.map((s) => (
              <li key={s.time} className="overflow-hidden rounded-3xl bg-black/25 backdrop-blur">
                <Photo name={s.slot} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full object-cover" />
                <div className="p-5">
                  <p className="text-sm font-semibold text-[#FDE68A]">{s.time}</p>
                  <h3 className="mt-1 text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="relative h-[520vh]" aria-labelledby="jour-titre">
      <div className="sticky top-0 h-screen overflow-hidden">
        <Scene progress={scrollYProgress} active={active} />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center gap-5 px-4 pb-16 pt-20 sm:px-6 lg:grid lg:grid-cols-[auto_1fr_1fr] lg:items-center lg:gap-10">
          <div className="hidden lg:block"><Timeline active={active} /></div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Une journée à Tranonay</p>
            <h2 id="jour-titre" className="mt-2 text-white drop-shadow">De l’aube à la nuit, tout est prévu</h2>
            {/* Toutes les cartes occupent la même cellule de grille : la hauteur suit la plus longue. */}
            <div className="mt-5 grid" aria-hidden="true">
              {stages.map((s, i) => (
                <div
                  key={s.time}
                  className={`col-start-1 row-start-1 rounded-3xl bg-black/30 p-5 backdrop-blur-md transition duration-500 ${
                    i === active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#FDE68A]">{s.time}</p>
                  <h3 className="mt-1 text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/90">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 lg:hidden"><Timeline active={active} /></div>
          </div>

          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20 lg:max-w-none" aria-hidden="true">
            {stages.map((s, i) => (
              <Photo
                key={s.slot}
                name={s.slot}
                alt=""
                sizes="(min-width: 1024px) 40vw, 90vw"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>
        </div>
        {textList}
      </div>
    </section>
  )
}
