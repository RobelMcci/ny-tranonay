import { useEffect, useState } from 'react'
import { eventTypes, whatsappLink } from '../data/site.js'
import { WhatsappIcon } from './Icons.jsx'

const encode = (form) => new URLSearchParams(new FormData(form)).toString()

/**
 * Formulaire Netlify Forms. Il est pré-rendu dans le HTML statique, ce qui permet à Netlify
 * de le détecter au déploiement (impossible avec un formulaire rendu seulement côté client).
 */
export default function ContactForm() {
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [today, setToday] = useState('') // calculé côté client pour éviter un écart d'hydratation

  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(e.currentTarget),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('success')
      e.currentTarget.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <form
      name="reservation"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={onSubmit}
      className="card-surface space-y-4"
    >
      <input type="hidden" name="form-name" value="reservation" />
      <p className="hidden">
        <label>Ne pas remplir : <input name="bot-field" tabIndex={-1} autoComplete="off" /></label>
      </p>

      <h2 className="text-2xl">Envoyer une demande</h2>
      <p className="text-sm text-slate-600">Dites-nous l’essentiel, nous vous recontactons pour confirmer disponibilités et tarif.</p>

      <div>
        <label htmlFor="cf-name" className="field-label">Nom complet *</label>
        <input id="cf-name" className="input-field" name="name" required minLength={2} autoComplete="name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-phone" className="field-label">Téléphone *</label>
          <input id="cf-phone" className="input-field" name="phone" type="tel" required pattern="[0-9+\s]{8,}" inputMode="tel" autoComplete="tel" placeholder="034 00 000 00" />
        </div>
        <div>
          <label htmlFor="cf-email" className="field-label">Email (facultatif)</label>
          <input id="cf-email" className="input-field" name="email" type="email" autoComplete="email" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-event" className="field-label">Type d’événement *</label>
          <select id="cf-event" className="input-field" name="event" required defaultValue="">
            <option value="" disabled>Choisir…</option>
            {eventTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-date" className="field-label">Date souhaitée</label>
          <input id="cf-date" className="input-field" name="date" type="date" min={today || undefined} />
        </div>
      </div>
      <div>
        <label htmlFor="cf-guests" className="field-label">Nombre de personnes</label>
        <input id="cf-guests" className="input-field" name="guests" type="number" min="1" inputMode="numeric" />
      </div>
      <div>
        <label htmlFor="cf-message" className="field-label">Message</label>
        <textarea id="cf-message" className="input-field min-h-[120px]" name="message" maxLength={800} />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Envoi en cours…' : 'Envoyer ma demande'}
      </button>

      <div aria-live="polite">
        {status === 'success' && (
          <p className="rounded-xl bg-[#047857]/10 p-3 text-sm font-medium text-[#065F46]">
            Merci ! Votre demande est bien envoyée, nous vous recontactons très vite.
          </p>
        )}
        {status === 'error' && (
          <p className="rounded-xl bg-[#C2410C]/10 p-3 text-sm font-medium text-[#9A3412]">
            L’envoi n’a pas abouti. Écrivez-nous directement :{' '}
            <a className="underline" href={whatsappLink('Bonjour Tranonay, je souhaite des informations.')} target="_blank" rel="noreferrer">
              <WhatsappIcon className="inline" /> WhatsApp
            </a>
          </p>
        )}
      </div>
      <p className="text-xs text-slate-500">* Champs obligatoires. Vos données ne servent qu’à répondre à votre demande.</p>
    </form>
  )
}
