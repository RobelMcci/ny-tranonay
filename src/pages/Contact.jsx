import { business, hours, mapsDirectionsUrl, mapsEmbedUrl, whatsappLink } from '../data/site.js'
import { businessSchema } from '../lib/schema.js'
import ContactForm from '../components/ContactForm.jsx'
import { FacebookIcon, MailIcon, MessengerIcon, PhoneIcon, PinIcon, WhatsappIcon } from '../components/Icons.jsx'
import OpenStatus from '../components/OpenStatus.jsx'
import PageHero from '../components/PageHero.jsx'
import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'

const row = 'flex items-center gap-3 rounded-2xl bg-white p-4 font-semibold text-[#2B211B] shadow-soft ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg'

export function Component() {
  return (
    <>
      <Seo path="/contact" nodes={[businessSchema()]} />

      <PageHero
        photo="facadeJour"
        eyebrow="Contact & accès"
        title="Contacter Tranonay, à Ambohimasina"
        lead="Un renseignement, une date à bloquer, une visite ? Écrivez-nous là où vous êtes le plus à l’aise."
      />

      <section className="section grid gap-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-2xl">Nous joindre</h2>
          <ul className="mt-6 space-y-3">
            <li><a className={row} href={whatsappLink('Bonjour Tranonay, je souhaite des informations.')} target="_blank" rel="noreferrer"><WhatsappIcon className="text-[#16A34A]" /> WhatsApp · {business.phone}</a></li>
            <li><a className={row} href={business.phoneHref}><PhoneIcon className="text-[#C2410C]" /> Appeler · {business.phone}</a></li>
            <li><a className={row} href={business.messengerUrl} target="_blank" rel="noreferrer"><MessengerIcon className="text-[#0866FF]" /> Messenger · Tranonay</a></li>
            <li><a className={row} href={`mailto:${business.email}`}><MailIcon className="text-[#C2410C]" /> {business.email}</a></li>
            <li><a className={row} href={business.facebookUrl} target="_blank" rel="noreferrer"><FacebookIcon className="text-[#1877F2]" /> Page Facebook Tranonay</a></li>
          </ul>

          <h2 className="mt-10 text-2xl">Horaires</h2>
          <p className="mt-3 text-slate-700">
            Ouvert {hours.label.toLowerCase()}. Les nuitées de privatisation (18h à 9h) et les chambres (check-in 10h, check-out 10h) suivent leurs propres horaires.
          </p>
          <OpenStatus className="mt-4" />

          <h2 className="mt-10 text-2xl">Nous trouver</h2>
          <address className="mt-4 flex items-start gap-3 not-italic text-slate-700">
            <PinIcon className="mt-1 shrink-0 text-[#C2410C]" />
            <span>
              {business.address.street}
              <br />
              {business.address.city} {business.address.postalCode}, {business.address.country}
            </span>
          </address>
          <a href={mapsDirectionsUrl} target="_blank" rel="noreferrer" className="btn-outline mt-5">Itinéraire Google Maps</a>
          <div className="mt-6 overflow-hidden rounded-3xl shadow-soft ring-1 ring-black/5">
            <iframe
              title="Carte : Tranonay, Ambohimasina, route vers le CUR Vontovorona"
              src={mapsEmbedUrl}
              className="h-[320px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </section>
    </>
  )
}
