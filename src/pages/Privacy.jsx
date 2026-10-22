import { business } from '../data/site.js'
import Seo from '../components/Seo.jsx'

export function Component() {
  return (
    <>
      <Seo path="/confidentialite" />
      <article className="prose-page mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h1>Politique de confidentialité</h1>

        <h2>Données collectées</h2>
        <p>
          Lorsque vous utilisez le formulaire de contact, nous recevons les informations que vous saisissez : nom, téléphone, email (facultatif), type d’événement, date, nombre de personnes et message.
        </p>

        <h2>Utilisation</h2>
        <p>
          Ces données servent uniquement à répondre à votre demande de renseignement ou de réservation. Elles ne sont ni vendues ni utilisées à des fins publicitaires.
        </p>

        <h2>Traitement et hébergement</h2>
        <p>
          Le formulaire est traité par Netlify (hébergeur du site). Le simulateur de devis fonctionne dans votre navigateur : rien n’est envoyé tant que vous ne cliquez pas sur WhatsApp, Messenger ou le formulaire. La carte d’invitation est générée localement sur votre appareil.
        </p>

        <h2>Cookies et services tiers</h2>
        <p>
          Ce site n’utilise aucun cookie publicitaire ni outil de suivi. La carte de la page Contact est fournie par Google Maps, qui peut déposer ses propres cookies lorsqu’elle s’affiche.
        </p>

        <h2>Vos droits</h2>
        <p>
          Vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à <a href={`mailto:${business.email}`}>{business.email}</a>.
        </p>
      </article>
    </>
  )
}
