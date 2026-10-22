import { business, hours, prices, rooms } from '../data/site.js'
import CountUp from './CountUp.jsx'
import Reveal from './Reveal.jsx'

const stats = [
  { to: business.facebookFollowers, suffix: '+', label: 'abonnés sur Facebook' },
  { to: prices.reception.maxGuests, suffix: '', label: 'invités en salle de réception' },
  { to: rooms.length, suffix: '', label: 'types de chambres climatisées' },
  { to: hours.close - hours.open, suffix: ' h', label: 'd’ouverture chaque jour' },
]

export default function StatsBand() {
  return (
    <section aria-label="Tranonay en chiffres" className="bg-[#FFFCF8]">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="flex flex-col text-center">
            <dt className="order-2 mt-1 text-sm font-medium text-slate-600">{s.label}</dt>
            <dd className="order-1 font-display text-5xl font-semibold text-gradient-brand sm:text-6xl">
              <CountUp to={s.to} suffix={s.suffix} />
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  )
}
