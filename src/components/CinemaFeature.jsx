import { Link } from 'react-router-dom'
import { ArrowIcon } from './Icons.jsx'
import ParallaxPhoto from './ParallaxPhoto.jsx'
import Reveal from './Reveal.jsx'

// Étoiles fixes (même rendu serveur / client).
const stars = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 37.7) % 100,
  y: (i * 53.3 + 11) % 100,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.5,
}))

/** Section sombre « cinéma en plein air » avec ciel étoilé et photos en parallaxe. */
export default function CinemaFeature() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0B1026] text-white" aria-labelledby="cinema-titre">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {stars.map((s) => (
          <span
            key={`${s.x}-${s.y}`}
            className="twinkle absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
          />
        ))}
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#4C1D95]/40 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#047857]/25 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FDE68A]">Cinéma en plein air</p>
          <h2 id="cinema-titre" className="mt-3 text-white">Une soirée cinéma sous les étoiles, au bord de la piscine</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Un grand écran de projection installé dans le jardin, face à la piscine éclairée : allongez-vous sur la pelouse, lancez votre film et laissez la nuit faire le reste. En salle, un écran TV de 80 pouces prend le relais si le temps se gâte.
          </p>
          <Link to="/privatisation-piscine" className="btn-light mt-8">
            Privatiser une soirée <ArrowIcon width={18} height={18} />
          </Link>
        </Reveal>

        <Reveal delay={0.1} className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <ParallaxPhoto name="cinema.1" sizes="(min-width: 1024px) 40vw, 90vw" className="aspect-[4/3] rounded-3xl shadow-2xl ring-1 ring-white/15" />
          <div className="float-slow absolute -bottom-8 -left-4 w-[46%] overflow-hidden rounded-2xl shadow-2xl ring-4 ring-[#0B1026] [--r:-3deg] sm:-left-8">
            <ParallaxPhoto name="cinema.2" sizes="25vw" strength={14} className="aspect-[4/3]" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
