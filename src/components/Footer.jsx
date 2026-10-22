import { Link } from 'react-router-dom'
import { business, pages, security, whatsappLink } from '../data/site.js'
import OpenStatus from './OpenStatus.jsx'
import { FacebookIcon, MailIcon, MessengerIcon, PhoneIcon, PinIcon, ShieldIcon, WhatsappIcon } from './Icons.jsx'

const navPages = pages.filter((p) => p.nav)
const heading = 'mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/60'
const link = 'inline-flex items-center gap-2 text-white/80 transition hover:text-white'

export default function Footer() {
  return (
    <footer className="bg-[#2B211B] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src="/icon.svg" alt="" width="48" height="48" className="h-12 w-12 rounded-full" loading="lazy" />
              <span className="font-display text-2xl font-semibold">Tranonay</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Services événementiels à Antananarivo : salle de réception, privatisation avec piscine, karaoké et jeux, chambres sur place.
            </p>
            <a href={business.facebookUrl} target="_blank" rel="noreferrer" className={`${link} mt-5 text-sm font-semibold`}>
              <FacebookIcon /> Suivez-nous sur Facebook
            </a>
            <div className="mt-4"><OpenStatus tone="light" /></div>
          </div>

          <nav aria-label="Pied de page">
            <h2 className={heading}>Le site</h2>
            <ul className="space-y-3 text-sm">
              {navPages.map((p) => (
                <li key={p.path}>
                  <Link to={p.path} className={link}>{p.nav}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={heading}>Contact</h2>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <PinIcon className="mt-0.5 shrink-0" />
                <address className="not-italic">
                  {business.address.street}
                  <br />
                  {business.address.city} {business.address.postalCode}, {business.address.country}
                </address>
              </li>
              <li><a href={business.phoneHref} className={link}><PhoneIcon /> {business.phone}</a></li>
              <li><a href={whatsappLink()} target="_blank" rel="noreferrer" className={link}><WhatsappIcon /> WhatsApp</a></li>
              <li><a href={business.messengerUrl} target="_blank" rel="noreferrer" className={link}><MessengerIcon /> Messenger</a></li>
              <li><a href={`mailto:${business.email}`} className={link}><MailIcon /> {business.email}</a></li>
            </ul>
          </div>

          <div>
            <h2 className={heading}>Lieu sécurisé</h2>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-white/80">
              <ShieldIcon className="mt-0.5 shrink-0 text-[#34D399]" />
              <span>
                Gardiens des propriétaires sur place, avec le renfort de{' '}
                <a href={security.partnerUrl} target="_blank" rel="noreferrer" className="font-semibold text-white underline underline-offset-2">
                  {security.partnerName}
                </a>
                .
              </span>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row">
          <p>© 2026 Tranonay — Ambohimasina, Antananarivo. Tous droits réservés.</p>
          <ul className="flex gap-5">
            <li><Link to="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
            <li><Link to="/confidentialite" className="hover:text-white">Confidentialité</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
