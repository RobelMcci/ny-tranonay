import { Link } from 'react-router-dom'
import { eventTypes, prices, receptionIncludes, text } from '../data/site.js'
import { formatAr } from '../lib/quote.js'
import { serviceSchema } from '../lib/schema.js'
import CtaBand from '../components/CtaBand.jsx'
import PageHero from '../components/PageHero.jsx'
import ParallaxPhoto from '../components/ParallaxPhoto.jsx'
import Photo from '../components/Photo.jsx'
import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'

export function Component() {
  return (
    <>
      <Seo
        path="/salle-reception-evenements"
        nodes={[
          serviceSchema(
            'Location de salle de réception',
            `Salle dinatoire équipée pour ${prices.reception.maxGuests} personnes : ${receptionIncludes.join(', ')}.`,
            prices.reception.perDay,
          ),
        ]}
      />

      <PageHero
        photo="salleLongue"
        eyebrow="Salle & réceptions"
        title={text('salle.hero.titre')}
        lead={text('salle.hero.intro')}
      >
        <Link to="/tarifs-devis#simulateur" className="btn-primary">Obtenir un devis</Link>
      </PageHero>

      <section className="section grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Reveal>
          <p className="eyebrow">Le pack réception</p>
          <h2 className="section-title">Tout est prévu, vous n’apportez que vos invités</h2>
          <p className="section-lead">
            Tranonay se trouve à Ambohimasina, sur la route vers le CUR de Vontovorona. La salle dinatoire est lumineuse, avec de grandes baies vitrées, et la cuisine équipée est incluse pour préparer vos plats ou ceux de votre traiteur.
          </p>
          <ul className="check-list mt-6 grid gap-3 sm:grid-cols-2">
            {receptionIncludes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="rounded-3xl bg-gradient-to-br from-[#C2410C] to-[#047857] p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Tarif</p>
          <p className="mt-3 font-display text-5xl font-semibold">{formatAr(prices.reception.perDay)}</p>
          <p className="mt-1 text-white/90">par jour, de 8h30 à 18h</p>
          <p className="mt-5 text-sm text-white/90">Capacité : {prices.reception.maxGuests} personnes maximum pour cette formule.</p>
          <Link to="/tarifs-devis#simulateur" className="btn-light mt-6 w-full">Calculer mon devis</Link>
        </Reveal>
      </section>

      <section className="bg-[#FDF6EC]">
        <div className="section">
          <div className="grid gap-4 sm:grid-cols-3">
            {['tableDressee', 'salle', 'tables'].map((name, i) => (
              <Reveal key={name} delay={i * 0.08}>
                <ParallaxPhoto name={name} sizes="(min-width: 640px) 33vw, 100vw" className="aspect-[3/4] rounded-3xl" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section grid gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">Pour quelles occasions ?</p>
          <h2 className="section-title">Chaque célébration a sa place</h2>
          <ul className="check-list mt-6 space-y-3">
            {eventTypes.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">Restauration</p>
          <h2 className="section-title">Vos plats ou les nôtres</h2>
          <p className="section-lead">
            La nourriture de l’extérieur est autorisée, les boissons sont servies sur place. Vous préférez ne pas vous en occuper ? Une restauration sur commande est possible : plat du jour à {formatAr(prices.meals.platDuJour)} ou plat complet (entrée, plat, dessert) à {formatAr(prices.meals.platComplet)}.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Photo name="salle.1" sizes="(min-width: 1024px) 20vw, 45vw" className="aspect-[3/4] w-full rounded-2xl object-cover" />
            <Photo name="salle.2" sizes="(min-width: 1024px) 20vw, 45vw" className="aspect-[3/4] w-full rounded-2xl object-cover" />
          </div>
        </Reveal>
      </section>

      <section className="section pt-0">
        <Reveal className="card-surface">
          <h2 className="text-2xl">Prolongez la fête</h2>
          <p className="mt-3 text-slate-600">
            Combinez la réception avec la <Link to="/privatisation-piscine" className="font-semibold text-[#C2410C] underline underline-offset-2">privatisation et la piscine</Link> ou passez la nuit sur place dans nos{' '}
            <Link to="/chambres" className="font-semibold text-[#C2410C] underline underline-offset-2">chambres climatisées</Link>. Le site est surveillé, pour que tout le monde profite sereinement.
          </p>
        </Reveal>
      </section>

      <CtaBand title="Votre réception à Tranonay" />
    </>
  )
}
