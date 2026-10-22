import { Link } from 'react-router-dom'
import { formatAr } from '../lib/quote.js'
import { packCouple, whatsappLink } from '../data/site.js'
import { WhatsappIcon } from './Icons.jsx'
import Photo from './Photo.jsx'
import Reveal from './Reveal.jsx'

/** Offre « Pack couple » (affiche diffusée par Tranonay). */
export default function PackCouple() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20" aria-labelledby="pack-couple-titre">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7C2D12] via-[#C2410C] to-[#D97706] text-white shadow-2xl">
        <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FED7AA]">Offre à deux</p>
            <h2 id="pack-couple-titre" className="mt-2 text-white">Pack couple</h2>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="whitespace-nowrap font-display text-4xl font-semibold sm:text-6xl">{formatAr(packCouple.price)}</span>
              <span className="text-sm text-white/80">la nuitée</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {packCouple.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-white/95">
                  <span aria-hidden="true" className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={whatsappLink(`Bonjour Tranonay, je souhaite réserver le Pack couple (${formatAr(packCouple.price)}).`)} target="_blank" rel="noreferrer" className="btn-light">
                <WhatsappIcon /> Réserver le pack
              </a>
              <Link to="/tarifs-devis#simulateur" className="btn-ghost-light">Voir les tarifs</Link>
            </div>
          </div>

          <div className="relative mx-auto h-72 w-full max-w-md sm:h-96" aria-hidden="true">
            <div className="float-slow absolute left-0 top-0 w-[58%] overflow-hidden rounded-3xl shadow-2xl ring-4 ring-white/80 [--r:-4deg]">
              <Photo name="chambreOrange" sizes="30vw" alt="" className="aspect-[4/5] w-full object-cover" />
            </div>
            <div className="float-slow absolute bottom-0 right-0 w-[58%] overflow-hidden rounded-3xl shadow-2xl ring-4 ring-white/80 [--r:3deg]" style={{ animationDelay: '-2.5s' }}>
              <Photo name="packRepas" sizes="30vw" alt="" className="aspect-square w-full object-cover" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
