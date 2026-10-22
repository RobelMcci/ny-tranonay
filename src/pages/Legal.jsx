import { business } from '../data/site.js'
import Seo from '../components/Seo.jsx'

export function Component() {
  return (
    <>
      <Seo path="/mentions-legales" />
      <article className="prose-page mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h1>Mentions légales</h1>

        <h2>Éditeur du site</h2>
        <p>
          Tranonay — {business.address.street}, {business.address.city} {business.address.postalCode}, {business.address.country}.
          <br />
          Téléphone : <a href={business.phoneHref}>{business.phone}</a> · Email : <a href={`mailto:${business.email}`}>{business.email}</a>
        </p>
        <p>Responsable de la publication : la direction de Tranonay.</p>

        <h2>Hébergement</h2>
        <p>Netlify, Inc. — 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis — netlify.com.</p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes, photographies et éléments graphiques de ce site sont la propriété de Tranonay. Toute reproduction sans autorisation écrite est interdite.
        </p>

        <h2>Responsabilité</h2>
        <p>
          Les tarifs et estimations affichés sont indicatifs ; les disponibilités et prix définitifs sont confirmés par Tranonay lors de la réservation.
        </p>
      </article>
    </>
  )
}
