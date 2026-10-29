// Construit les données publiques du site (anciens exports de site.js) à partir d'un contenu publié.
// Fonction pure : aucune entrée/sortie. Ce fichier ne doit importer aucun asset ni src/lib/quote.js
// (qui importe site.js) : il est lu côté Node par vite.config.js.
import { buildVars, interpolate } from '../lib/interpolate.js'

// Jours d'ouverture et fuseau : constantes de code, jamais éditées.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_ZONE = 'Indian/Antananarivo'

/**
 * @param {object} content Contenu publié ou seed (voir le contrat `Content`).
 * @returns {object} Les données du site : business, hours, security, prices, packCouple, listes,
 *   rooms, faqs, pages, photos, photoSlots, texts.
 */
export function buildSite(content) {
  const { settings: s } = content
  const vars = buildVars(content)
  const text = (value) => interpolate(value, vars)

  const amount = (key) => {
    const price = (content.prices ?? []).find((p) => p.key === key)
    if (!price) throw new Error(`Prix manquant : ${key}`)
    return price.amount
  }
  const list = (key) => [...(content.lists?.[key] ?? [])]

  const business = {
    name: s.name,
    tagline: s.tagline,
    phone: s.phone,
    phoneHref: `tel:${s.phone.replace(/[^\d+]/g, '')}`,
    whatsappNumber: s.whatsappNumber,
    email: s.email,
    facebookUrl: s.facebookUrl,
    messengerUrl: s.messengerUrl,
    address: {
      street: s.street,
      city: s.city,
      postalCode: s.postalCode,
      country: s.country,
      countryCode: s.countryCode,
    },
    geo: { latitude: s.latitude, longitude: s.longitude },
    facebookFollowers: s.facebookFollowers,
  }

  const hours = {
    open: s.openHour,
    close: s.closeHour,
    timeZone: TIME_ZONE,
    days: [...DAYS],
    label: s.hoursLabel,
  }

  const security = {
    summary: s.securitySummary,
    partnerName: s.securityPartnerName,
    partnerUrl: s.securityPartnerUrl,
  }

  const prices = {
    privatisation: { jour: amount('privatisation_jour'), nuit: amount('privatisation_nuit') },
    reception: { perDay: amount('reception_jour'), maxGuests: amount('reception_max_invites') },
    meals: { platDuJour: amount('plat_du_jour'), platComplet: amount('plat_complet') },
    couple: amount('pack_couple'),
  }

  const packCouple = { name: 'Pack couple', price: prices.couple, includes: list('pack_couple') }

  const rooms = (content.rooms ?? []).map((room) => ({
    id: room.id,
    name: room.name,
    price: room.price,
    features: [...room.features],
    photoKeys: [...(room.photoKeys ?? [])],
    quantity: room.quantity ?? 1,
  }))

  const faqs = (content.faqs ?? []).map((faq) => ({ q: text(faq.question), a: text(faq.answer) }))

  const pages = (content.pages ?? []).map((page) => ({
    path: page.path,
    nav: page.navLabel ?? null,
    title: text(page.title),
    description: text(page.description),
    priority: page.priority,
  }))

  const texts = Object.fromEntries(Object.entries(content.texts ?? {}).map(([key, value]) => [key, text(value)]))

  return {
    business,
    hours,
    security,
    prices,
    packCouple,
    privatisationIncludes: list('inclus_privatisation'),
    receptionIncludes: list('inclus_reception'),
    extras: list('extras'),
    rooms,
    activitiesList: list('activites'),
    roomHours: { checkIn: s.roomCheckIn, checkOut: s.roomCheckOut },
    eventTypes: list('types_evenement'),
    faqs,
    pages,
    photos: content.photos ?? [],
    photoSlots: content.photoSlots ?? {},
    texts,
  }
}
