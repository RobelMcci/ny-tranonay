import { Link } from 'react-router-dom'
import { activitiesList, business, prices, rooms, whatsappLink } from '../data/site.js'
import { formatAr } from '../lib/quote.js'
import { roomPriceRange } from '../lib/rooms.js'
import { businessSchema, faqSchema, websiteSchema } from '../lib/schema.js'
import Bento from '../components/Bento.jsx'
import CinemaFeature from '../components/CinemaFeature.jsx'
import CountUp from '../components/CountUp.jsx'
import CtaBand from '../components/CtaBand.jsx'
import DayNight from '../components/DayNight.jsx'
import Faq from '../components/Faq.jsx'
import Gallery from '../components/Gallery.jsx'
import HeroSlider from '../components/HeroSlider.jsx'
import { ArrowIcon, FacebookIcon, WhatsappIcon } from '../components/Icons.jsx'
import Marquee from '../components/Marquee.jsx'
import OpenStatus from '../components/OpenStatus.jsx'
import PackCouple from '../components/PackCouple.jsx'
import Photo from '../components/Photo.jsx'
import Reveal from '../components/Reveal.jsx'
import RoomCarousel from '../components/RoomCarousel.jsx'
import SecurityBand from '../components/SecurityBand.jsx'
import Seo from '../components/Seo.jsx'
import StatsBand from '../components/StatsBand.jsx'
import Tilt from '../components/Tilt.jsx'

const headline = 'Salle de réception, piscine et chambres à Antananarivo'.split(' ')

const roomRange = roomPriceRange(rooms)

const offers = [
  {
    to: '/salle-reception-evenements',
    slot: 'accueil.offre.salle',
    title: 'Salle de réception',
    text: 'Salle dinatoire équipée, couverts, nappes, housses de chaise, décoration florale et sono : tout est prêt.',
    price: `${formatAr(prices.reception.perDay)} / jour`,
  },
  {
    to: '/privatisation-piscine',
    slot: 'accueil.offre.privatisation',
    title: 'Privatisation & piscine',
    text: 'Piscine, cinéma en plein air, karaoké, baby-foot, jeux vidéo et simulateur de course rien que pour votre groupe.',
    price: `${formatAr(prices.privatisation.jour)} / journée ou nuitée`,
  },
  {
    to: '/chambres',
    slot: 'accueil.offre.chambres',
    title: 'Chambres sur place',
    text: 'Chambres climatisées avec eau chaude, wifi et terrasse privée pour prolonger la fête.',
    price: roomRange ? `dès ${formatAr(roomRange.min)} / nuit` : null,
  },
]

export function Component() {
  return (
    <>
      <Seo path="/" nodes={[businessSchema(), websiteSchema(), faqSchema()]} />

      <HeroSlider>
        <OpenStatus tone="light" className="anim-rise" />
        <p className="anim-rise mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#FDBA74]" style={{ animationDelay: '0.04s' }}>
          Ambohimasina · route du CUR Vontovorona · Antananarivo
        </p>
        <h1 className="mt-4 max-w-4xl text-white">
          {headline.map((word, i) => (
            <span key={`${word}-${i}`}>
              <span className="anim-rise inline-block" style={{ animationDelay: `${0.06 + i * 0.045}s` }}>{word}</span>{' '}
            </span>
          ))}
        </h1>
        <p className="anim-rise mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-xl" style={{ animationDelay: '0.35s' }}>
          Anniversaires, réceptions et soirées : une grande salle dressée, une piscine privatisable, un cinéma en plein air et des chambres climatisées, sur un site surveillé.
        </p>
        <div className="anim-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '0.45s' }}>
          <Link to="/tarifs-devis#simulateur" className="btn-primary">Estimer mon événement</Link>
          <a href={whatsappLink('Bonjour Tranonay, je souhaite des informations.')} target="_blank" rel="noreferrer" className="btn-ghost-light">
            <WhatsappIcon /> WhatsApp
          </a>
        </div>
      </HeroSlider>

      <section aria-label="Activités et équipements" className="overflow-hidden bg-[#FFFCF8] pb-6 pt-2">
        <Marquee items={activitiesList} className="text-[#2B211B]" />
        <Marquee items={[...activitiesList].reverse()} reverse outline className="mt-3 text-[#C2410C]/70" />
      </section>

      <StatsBand />

      <section className="section pt-4">
        <Reveal>
          <p className="eyebrow">Nos formules</p>
          <h2 className="section-title max-w-3xl">Un seul lieu, trois façons d’en profiter</h2>
          <p className="section-lead">
            Que vous organisiez un repas de famille, une soirée entre amis ou une journée de détente, choisissez la formule qui vous ressemble.
          </p>
        </Reveal>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {offers.map((o, i) => (
            <Reveal as="li" key={o.to} delay={i * 0.08}>
              <Tilt className="h-full">
                <Link to={o.to} className="group block h-full overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 transition-shadow hover:shadow-2xl">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Photo name={o.slot} sizes="(min-width: 768px) 33vw, 100vw" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-6">
                    <h3>{o.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{o.text}</p>
                    <p className={`mt-4 flex items-center ${o.price ? 'justify-between' : 'justify-end'} text-sm font-bold text-[#C2410C]`}>
                      {o.price}
                      <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">Découvrir <ArrowIcon width={16} height={16} /></span>
                    </p>
                  </div>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </ul>
      </section>

      <PackCouple />

      <DayNight />

      <CinemaFeature />

      <section className="section">
        <Reveal>
          <p className="eyebrow">Pour tous les âges</p>
          <h2 className="section-title max-w-3xl">Des jeux pour les grands, de quoi s’amuser pour les petits</h2>
        </Reveal>
        <div className="mt-10"><Bento /></div>
        <p className="mt-6 text-sm text-slate-600">
          Et aussi : water gun, jeux vidéo sur PC, karaoké, barbecue.{' '}
          <Link to="/privatisation-piscine" className="font-semibold text-[#C2410C] underline underline-offset-2">Voir la privatisation</Link>
        </p>
      </section>

      <section className="bg-[#FDF6EC] py-14 lg:py-20" aria-labelledby="chambres-titre">
        <Reveal className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow">Chambres</p>
          <h2 id="chambres-titre" className="section-title max-w-3xl">Prolongez la fête, dormez sur place</h2>
          <p className="section-lead">
            {roomRange
              ? <>Quatre types de chambres climatisées, de {formatAr(roomRange.min)} à {formatAr(roomRange.max)} la nuit.</>
              : 'Des chambres climatisées pour dormir sur place.'}
          </p>
        </Reveal>
        <div className="mx-auto mt-8 max-w-[90rem]"><RoomCarousel /></div>
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <Link to="/chambres" className="btn-outline">Voir les chambres et les tarifs</Link>
        </div>
      </section>

      <section aria-labelledby="galerie-titre">
        <div className="section">
          <Reveal className="text-center">
            <p className="eyebrow">Galerie</p>
            <h2 id="galerie-titre" className="section-title">Le lieu en images</h2>
            <p className="section-lead mx-auto">Photos réelles de l’espace, de la salle, des chambres et des buffets.</p>
          </Reveal>
          <div className="mt-8"><Gallery limit={12} /></div>
        </div>
      </section>

      <SecurityBand />

      <section className="section">
        <div className="relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-black/5 md:grid-cols-[1fr_auto] md:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1877F2]/10 blur-3xl" aria-hidden="true" />
          <Reveal className="relative">
            <p className="eyebrow">La communauté</p>
            <h2 className="section-title">
              <span className="text-gradient-brand"><CountUp to={business.facebookFollowers} suffix="+" /></span> abonnés nous suivent sur Facebook
            </h2>
            <p className="section-lead">
              Actualités, photos des événements et nouveautés : rejoignez la page, et laissez votre avis après votre passage.
            </p>
          </Reveal>
          <a href={business.facebookUrl} target="_blank" rel="noreferrer" className="btn-primary relative !bg-[#1459B8] hover:!bg-[#0F4A9C]">
            <FacebookIcon /> Notre page Facebook
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:pb-24" aria-labelledby="faq-titre">
        <Reveal className="text-center">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-titre" className="section-title">Questions fréquentes</h2>
        </Reveal>
        <div className="mt-8"><Faq /></div>
      </section>

      <CtaBand />
    </>
  )
}
