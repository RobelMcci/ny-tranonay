import { prices, rooms } from '../data/site.js'
import { formatAr, formatDateFr } from './format.js'

export { formatAr, formatDateFr }

export const emptyQuoteInput = () => ({
  formula: 'privatisation', // 'privatisation' | 'reception' | 'sejour' | 'couple'
  slots: { jour: true, nuit: false },
  receptionDays: 1,
  couplePacks: 1,
  guests: 20,
  nights: 1,
  rooms: {},
  meals: { platDuJour: 0, platComplet: 0 },
  eventType: '',
  date: '',
  name: '',
})

const count = (value) => {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Calcule les lignes et le total (Ar) d'une demande. Fonction pure.
 * `content` a la forme des exports `prices` et `rooms` de site.js (par défaut : le contenu actuel du site). */
export function buildQuote(input, content = { prices, rooms }) {
  const { prices: p, rooms: roomList } = content
  const lines = []
  const warnings = []

  if (input.formula === 'privatisation') {
    if (input.slots?.jour) lines.push({ label: 'Privatisation — journée (8h30-18h)', amount: p.privatisation.jour })
    if (input.slots?.nuit) lines.push({ label: 'Privatisation — nuitée (18h-9h)', amount: p.privatisation.nuit })
    if (!input.slots?.jour && !input.slots?.nuit) warnings.push('Choisissez la journée, la nuitée, ou les deux.')
  }

  if (input.formula === 'reception') {
    const days = Math.max(1, count(input.receptionDays))
    lines.push({
      label: days > 1 ? `Réception événementielle — ${days} jours` : 'Réception événementielle — 1 jour (8h30-18h)',
      amount: p.reception.perDay * days,
    })
    if (count(input.guests) > p.reception.maxGuests) {
      warnings.push(`La réception accueille ${p.reception.maxGuests} personnes maximum : contactez-nous pour un groupe plus grand.`)
    }
  }

  if (input.formula === 'couple') {
    const packs = Math.max(1, count(input.couplePacks))
    lines.push({ label: packs > 1 ? `${packs} × Pack couple` : 'Pack couple (nuitée, repas, petit-déjeuner)', amount: p.couple * packs })
  }

  const nights = Math.max(1, count(input.nights))
  for (const room of roomList) {
    const qty = count(input.rooms?.[room.id])
    if (qty > 0) {
      lines.push({
        label: `${qty} × ${room.name} — ${nights} nuit${nights > 1 ? 's' : ''}`,
        amount: room.price * qty * nights,
      })
    }
  }

  const platDuJour = count(input.meals?.platDuJour)
  if (platDuJour > 0) lines.push({ label: `${platDuJour} × plat du jour`, amount: p.meals.platDuJour * platDuJour })
  const platComplet = count(input.meals?.platComplet)
  if (platComplet > 0) lines.push({ label: `${platComplet} × plat complet`, amount: p.meals.platComplet * platComplet })

  const total = lines.reduce((sum, line) => sum + line.amount, 0)
  return { lines, total, warnings }
}

/** Message prérempli pour WhatsApp / Messenger. */
export function quoteToMessage(input, quote) {
  const parts = [`Bonjour Tranonay${input.name ? `, je suis ${input.name}` : ''}.`, 'Je souhaite réserver :']
  if (input.eventType) parts.push(`• Événement : ${input.eventType}`)
  const date = formatDateFr(input.date)
  if (date) parts.push(`• Date : ${date}`)
  if (count(input.guests) > 0) parts.push(`• Personnes : ${count(input.guests)}`)
  quote.lines.forEach((line) => parts.push(`• ${line.label} : ${formatAr(line.amount)}`))
  parts.push(`Estimation : ${formatAr(quote.total)} (à confirmer avec vous).`)
  return parts.join('\n')
}
