import { packCouple, prices, roomHours, rooms, text } from '../data/site.js'
import { formatAr } from '../lib/quote.js'
import { faqSchema, offersSchema } from '../lib/schema.js'
import Faq from '../components/Faq.jsx'
import PageHero from '../components/PageHero.jsx'
import QuoteSimulator from '../components/QuoteSimulator.jsx'
import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'

const th = 'bg-[#2B211B] px-4 py-3 text-left text-sm font-semibold text-white first:rounded-tl-2xl last:rounded-tr-2xl'
const td = 'border-b border-slate-100 px-4 py-3 text-sm'

function Table({ caption, rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-soft ring-1 ring-black/5">
      <table className="w-full min-w-[420px] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={th}>Formule</th>
            <th scope="col" className={th}>Détail</th>
            <th scope="col" className={`${th} text-right`}>Tarif</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, detail, price]) => (
            <tr key={name}>
              <th scope="row" className={`${td} text-left font-semibold text-[#2B211B]`}>{name}</th>
              <td className={`${td} text-slate-600`}>{detail}</td>
              <td className={`${td} text-right font-bold text-[#C2410C]`}>{price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Component() {
  return (
    <>
      <Seo path="/tarifs-devis" nodes={[offersSchema(), faqSchema()]} />

      <PageHero
        photo="tableDressee"
        eyebrow="Tarifs & devis"
        title={text('tarifs.hero.titre')}
        lead={text('tarifs.hero.intro')}
      />

      <section className="section">
        <Reveal>
          <p className="eyebrow">Grille tarifaire</p>
          <h2 className="section-title">Nos tarifs en ariary</h2>
        </Reveal>

        <div className="mt-8 space-y-8">
          <div>
            <h3 className="mb-3">Privatisation & réception</h3>
            <Table
              caption="Tarifs de privatisation et de réception"
              rows={[
                ['Privatisation — journée', '8h30 → 18h · piscine, salle, karaoké et jeux', formatAr(prices.privatisation.jour)],
                ['Privatisation — nuitée', '18h → 9h · piscine, salle, karaoké et jeux', formatAr(prices.privatisation.nuit)],
                ['Réception événementielle', `8h30 → 18h · ${prices.reception.maxGuests} personnes max.`, `${formatAr(prices.reception.perDay)} / jour`],
              ]}
            />
          </div>
          <div>
            <h3 className="mb-3">Chambres</h3>
            <Table
              caption="Tarifs des chambres par nuit"
              rows={[
                ...rooms.map((r) => [r.name, r.features.slice(0, 4).join(', '), `${formatAr(r.price)} / nuit`]),
                [packCouple.name, 'Nuitée, repas du soir et petit-déjeuner offert', `${formatAr(packCouple.price)} / pack`],
              ]}
            />
            <p className="mt-3 text-sm text-slate-600">Check-in à partir de {roomHours.checkIn}, check-out à {roomHours.checkOut}.</p>
          </div>
          <div>
            <h3 className="mb-3">Restauration sur commande</h3>
            <Table
              caption="Tarifs de la restauration"
              rows={[
                ['Plat du jour', 'Par personne', formatAr(prices.meals.platDuJour)],
                ['Plat complet', 'Entrée, plat, dessert · par personne', formatAr(prices.meals.platComplet)],
              ]}
            />
            <p className="mt-3 text-sm text-slate-600">Nourriture de l’extérieur autorisée. Les boissons sont servies sur place.</p>
          </div>
        </div>
      </section>

      <section id="simulateur" className="bg-[#FDF6EC] scroll-mt-20">
        <div className="section">
          <Reveal className="mb-8 max-w-2xl">
            <p className="eyebrow">Simulateur</p>
            <h2 className="section-title">Composez votre événement, voyez le prix</h2>
            <p className="section-lead">Choisissez votre formule, les chambres et les repas : l’estimation se met à jour en direct et se transforme en message prêt à envoyer.</p>
          </Reveal>
          <QuoteSimulator />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="faq-titre">
        <h2 id="faq-titre" className="section-title text-center">Questions fréquentes</h2>
        <div className="mt-8"><Faq /></div>
      </section>
    </>
  )
}
