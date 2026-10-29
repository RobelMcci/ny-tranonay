import { Link } from 'react-router-dom'
import { rooms, security, text } from '../data/site.js'
import { formatAr } from '../lib/quote.js'
import { roomPriceRange, roomTypesLabel } from '../lib/rooms.js'
import { serviceSchema } from '../lib/schema.js'
import { securityPartner } from '../lib/security.js'
import CtaBand from '../components/CtaBand.jsx'
import { ShieldIcon } from '../components/Icons.jsx'
import PackCouple from '../components/PackCouple.jsx'
import PageHero from '../components/PageHero.jsx'
import Photo, { RoomCardPhoto } from '../components/Photo.jsx'
import Reveal from '../components/Reveal.jsx'
import RoomCarousel from '../components/RoomCarousel.jsx'
import Seo from '../components/Seo.jsx'

const roomRange = roomPriceRange(rooms)
const roomsHeading = roomRange
  ? `${roomTypesLabel(rooms.length)}, de ${roomRange.min.toLocaleString('fr-FR').replace(/\s/g, ' ')} à ${formatAr(roomRange.max)} la nuit`
  : 'Nos chambres'
const partner = securityPartner(security)

export function Component() {
  return (
    <>
      <Seo
        path="/chambres"
        nodes={
          roomRange
            ? [
                serviceSchema(
                  'Chambres climatisées à Ambohimasina',
                  'Chambres avec climatisation, eau chaude, wifi et terrasse privée.',
                  roomRange.min,
                ),
              ]
            : []
        }
      />

      <PageHero
        photo="chambreTwin"
        eyebrow="Chambres"
        title={text('chambres.hero.titre')}
        lead={text('chambres.hero.intro')}
      >
        <Link to="/tarifs-devis#simulateur" className="btn-primary">Réserver une chambre</Link>
      </PageHero>

      <section className="bg-[#FDF6EC] py-12 lg:py-16" aria-labelledby="photos-chambres">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 id="photos-chambres" className="sr-only">Photos des chambres</h2>
        </div>
        <div className="mx-auto max-w-[90rem]"><RoomCarousel /></div>
      </section>

      <section className="section">
        <Reveal>
          <p className="eyebrow">Nos chambres</p>
          <h2 className="section-title">{roomsHeading}</h2>
        </Reveal>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((room, i) => (
            <Reveal as="li" key={room.id} delay={i * 0.06} className="card-surface flex flex-col">
              <RoomCardPhoto room={room} sizes="(min-width: 1024px) 25vw, 50vw" className="-mx-6 -mt-6 mb-4 aspect-[4/3] w-[calc(100%+3rem)] max-w-none rounded-t-3xl object-cover" />
              <h3>{room.name}</h3>
              <p className="mt-3">
                <span className="font-display text-3xl font-semibold text-[#C2410C]">{formatAr(room.price)}</span>
                <span className="ml-1 text-sm text-slate-500">/ nuit</span>
              </p>
              <ul className="check-list mt-4 flex-1 space-y-2">
                {room.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </Reveal>
          ))}
        </ul>
      </section>

      <PackCouple />

      <section className="bg-[#FDF6EC]">
        <div className="section grid gap-8 lg:grid-cols-2 lg:items-center">
          <Reveal className="grid grid-cols-2 gap-3">
            <Photo name="chambres.2" sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[3/4] w-full rounded-3xl object-cover" />
            <Photo name="chambres.3" sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[3/4] w-full rounded-3xl object-cover" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Dormir sereinement</p>
            <h2 className="section-title">Un site surveillé</h2>
            <p className="section-lead flex gap-3">
              <ShieldIcon className="mt-1 shrink-0 text-[#047857]" width={24} height={24} />
              <span>
                {partner
                  ? `Des gardiens employés par les propriétaires veillent sur le site, renforcés récemment par le groupe ${partner.name}.`
                  : 'Des gardiens employés par les propriétaires veillent sur le site.'}
              </span>
            </p>
            <p className="mt-5 text-slate-600">
              Combinez une chambre avec une <Link to="/privatisation-piscine" className="font-semibold text-[#C2410C] underline underline-offset-2">nuitée de privatisation</Link> (18h → 9h) ou une{' '}
              <Link to="/salle-reception-evenements" className="font-semibold text-[#C2410C] underline underline-offset-2">réception</Link> pour vos invités.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Réservez votre chambre" text="Indiquez vos dates, nous confirmons la disponibilité." />
    </>
  )
}
