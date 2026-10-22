import { Link } from 'react-router-dom'
import { extras, prices, privatisationIncludes } from '../data/site.js'
import { formatAr } from '../lib/quote.js'
import { serviceSchema } from '../lib/schema.js'
import CtaBand from '../components/CtaBand.jsx'
import Bento from '../components/Bento.jsx'
import CinemaFeature from '../components/CinemaFeature.jsx'
import { MoonIcon, SunIcon } from '../components/Icons.jsx'
import PageHero from '../components/PageHero.jsx'
import Photo from '../components/Photo.jsx'
import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'

const slots = [
  { key: 'jour', title: 'Journée de privatisation', hours: '8h30 → 18h', Icon: SunIcon },
  { key: 'nuit', title: 'Nuitée de privatisation', hours: '18h → 9h', Icon: MoonIcon, featured: true },
]

export function Component() {
  return (
    <>
      <Seo
        path="/privatisation-piscine"
        nodes={[
          serviceSchema(
            'Privatisation de l’espace de loisirs avec piscine',
            `Journée (8h30-18h) ou nuitée (18h-9h) avec accès à : ${privatisationIncludes.join(', ')}.`,
            prices.privatisation.jour,
          ),
        ]}
      />

      <PageHero
        photo="facadeJour"
        eyebrow="Privatisation & piscine"
        title="Privatisez la piscine et l’espace de loisirs à Antananarivo"
        lead="Le temps d’une journée ou d’une nuit, Tranonay est à vous : piscine, karaoké et dancing, baby-foot, jeux vidéo, simulateur de course, water gun et jeux de société."
      >
        <Link to="/tarifs-devis#simulateur" className="btn-primary">Estimer ma privatisation</Link>
      </PageHero>

      <section className="section">
        <Reveal>
          <p className="eyebrow">Tafir privatisation</p>
          <h2 className="section-title max-w-3xl">Deux créneaux, le même accès complet</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {slots.map(({ key, title, hours, Icon, featured }, i) => (
            <Reveal key={key} delay={i * 0.08} className={`card-surface ${featured ? 'ring-2 ring-[#C2410C]' : ''}`}>
              <div className="flex items-center gap-3 text-[#047857]">
                <Icon width={28} height={28} />
                <h3 className="text-[#2B211B]">{title}</h3>
              </div>
              <p className="mt-4 font-display text-4xl font-semibold text-[#C2410C]">{formatAr(prices.privatisation[key])}</p>
              <p className="mt-1 text-sm text-slate-600">{hours}</p>
              <ul className="check-list mt-5 grid gap-2 sm:grid-cols-2">
                {privatisationIncludes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Journée et nuitée se cumulent pour une escapade complète. Pour dormir sur place, ajoutez des{' '}
          <Link to="/chambres" className="font-semibold text-[#C2410C] underline underline-offset-2">chambres climatisées</Link>.
        </p>
      </section>

      <section className="bg-[#FDF6EC]">
        <div className="section grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <Reveal className="grid grid-cols-2 gap-3">
            <Photo name="piscine" sizes="(min-width: 1024px) 30vw, 50vw" className="aspect-[4/5] w-full rounded-3xl object-cover" />
            <Photo name="tentes" sizes="(min-width: 1024px) 30vw, 50vw" className="aspect-[4/5] w-full rounded-3xl object-cover" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Et aussi</p>
            <h2 className="section-title">Cinéma, barbecue et cuisine</h2>
            <ul className="check-list mt-6 space-y-3">
              {extras.map((e) => <li key={e}>{e}</li>)}
            </ul>
            <p className="mt-6 text-sm text-slate-600">Nourriture de l’extérieur autorisée, boissons sur place. Restauration sur commande possible.</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <Reveal>
          <p className="eyebrow">Les jeux</p>
          <h2 className="section-title max-w-3xl">Anniversaire, entre amis, EVG / EVJF, équipe d’entreprise</h2>
          <p className="section-lead">
            La privatisation vous donne tout le site pour votre groupe : personne d’autre autour, un espace pour se baigner, jouer, chanter et se retrouver autour du barbecue.
          </p>
        </Reveal>
        <div className="mt-10"><Bento /></div>
      </section>

      <CinemaFeature />

      <CtaBand title="Réservez votre journée ou votre nuit" />
    </>
  )
}
