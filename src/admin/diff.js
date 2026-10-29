// Écart entre deux contenus (voir « Contrat de contenu ») : fonction pure, sans entrée/sortie.
// Sert au bandeau de l'accueil et, plus tard, à l'écran « Publier ».
import { formatAr } from '../lib/format.js'
import { photoSlots } from '../data/photo-slots.js'
import { textSlots } from '../data/text-slots.js'
import { LIST_LABELS } from './list-keys.js'

/**
 * @typedef {object} Change
 * @property {'settings'|'prices'|'rooms'|'lists'|'faqs'|'pages'|'photos'|'photoSlots'|'texts'} section
 * @property {string} label Libellé lisible en français.
 * @property {'added'|'removed'|'changed'} kind
 * @property {string} [before] Valeur courte avant (absente pour `added`).
 * @property {string} [after] Valeur courte après (absente pour `removed`).
 */

const MAX_VALUE = 120

const SETTING_LABELS = {
  name: 'Identité — Nom',
  tagline: 'Identité — Slogan',
  phone: 'Contact — Téléphone',
  whatsappNumber: 'Contact — Numéro WhatsApp',
  email: 'Contact — E-mail',
  facebookUrl: 'Réseaux — Lien Facebook',
  messengerUrl: 'Réseaux — Lien Messenger',
  facebookFollowers: 'Réseaux — Abonnés Facebook',
  street: 'Adresse — Rue',
  city: 'Adresse — Ville',
  postalCode: 'Adresse — Code postal',
  country: 'Adresse — Pays',
  countryCode: 'Adresse — Code pays',
  latitude: 'Adresse — Latitude',
  longitude: 'Adresse — Longitude',
  openHour: 'Horaires — Heure d’ouverture',
  closeHour: 'Horaires — Heure de fermeture',
  hoursLabel: 'Horaires — Texte affiché',
  roomCheckIn: 'Chambres — Arrivée (check-in)',
  roomCheckOut: 'Chambres — Départ (check-out)',
  securitySummary: 'Sécurité — Description',
  securityPartnerName: 'Sécurité — Nom du partenaire',
  securityPartnerUrl: 'Sécurité — Lien du partenaire',
}

const ROOM_FIELDS = [
  ['name', 'nom'],
  ['price', 'prix'],
  ['features', 'équipements'],
  ['photoKeys', 'photos'],
  ['quantity', 'quantité'],
]

const PAGE_FIELDS = [
  ['title', 'titre'],
  ['description', 'description'],
  ['priority', 'priorité'],
  ['navLabel', 'libellé du menu'],
]

const PHOTO_FIELDS = [
  ['alt', 'texte alternatif'],
  ['category', 'catégorie'],
  ['galleryPosition', 'position dans la galerie'],
  ['file', 'fichier'],
  ['storagePath', 'fichier téléversé'],
]

const PAGE_LABELS = {
  accueil: 'Accueil',
  salle: 'Salle',
  privatisation: 'Privatisation',
  chambres: 'Chambres',
  tarifs: 'Tarifs',
  contact: 'Contact',
}

const arr = (value) => (Array.isArray(value) ? value : [])
const obj = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})
const isEmpty = (value) => value === null || value === undefined

/** Chaîne courte (≈120 caractères) pour l'affichage d'une valeur. */
function short(value) {
  if (isEmpty(value)) return ''
  const text = Array.isArray(value) ? value.join(', ') : String(value)
  return text.length > MAX_VALUE ? `${text.slice(0, MAX_VALUE)}…` : text
}

const sameValue = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

function change(section, label, kind, before, after) {
  const result = { section, label, kind }
  if (kind !== 'added') result.before = short(before)
  if (kind !== 'removed') result.after = short(after)
  return result
}

/** Même éléments communs dans le même ordre ? (les ajouts/retraits sont signalés à part) */
function orderChanged(beforeKeys, afterKeys) {
  const afterSet = new Set(afterKeys)
  const beforeSet = new Set(beforeKeys)
  const a = beforeKeys.filter((k) => afterSet.has(k))
  const b = afterKeys.filter((k) => beforeSet.has(k))
  return a.length === b.length && a.some((k, i) => k !== b[i])
}

/** Clés d'une paire d'objets : d'abord l'ordre `preferred`, puis les autres. */
function unionKeys(a, b, preferred = []) {
  const all = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...preferred.filter((k) => all.has(k)), ...[...all].filter((k) => !preferred.includes(k))]
}

function diffSettings(before, after) {
  const b = obj(before)
  const a = obj(after)
  const out = []
  for (const key of unionKeys(b, a, Object.keys(SETTING_LABELS))) {
    if (isEmpty(b[key]) && isEmpty(a[key])) continue
    if (!isEmpty(b[key]) && !isEmpty(a[key]) && sameValue(b[key], a[key])) continue
    const label = SETTING_LABELS[key] ?? `Réglage — ${key}`
    const kind = isEmpty(b[key]) ? 'added' : isEmpty(a[key]) ? 'removed' : 'changed'
    out.push(change('settings', label, kind, b[key], a[key]))
  }
  return out
}

const priceText = (price) => (price.unit === 'ar' ? formatAr(price.amount) : String(price.amount))

function diffPrices(before, after) {
  const b = arr(before)
  const a = arr(after)
  const out = []
  const beforeByKey = new Map(b.map((p) => [p.key, p]))
  const afterByKey = new Map(a.map((p) => [p.key, p]))
  for (const price of a) {
    const old = beforeByKey.get(price.key)
    const label = `Tarif — ${price.label || price.key}`
    if (!old) out.push(change('prices', label, 'added', null, priceText(price)))
    else if (old.amount !== price.amount) out.push(change('prices', label, 'changed', priceText(old), priceText(price)))
  }
  for (const price of b) {
    if (!afterByKey.has(price.key)) out.push(change('prices', `Tarif — ${price.label || price.key}`, 'removed', priceText(price), null))
  }
  return out
}

function diffRooms(before, after) {
  const b = arr(before)
  const a = arr(after)
  const out = []
  const beforeById = new Map(b.map((r) => [r.id, r]))
  const afterIds = new Set(a.map((r) => r.id))
  for (const room of a) {
    const old = beforeById.get(room.id)
    const name = room.name || room.id
    if (!old) {
      out.push(change('rooms', `Chambre — ${name}`, 'added', null, name))
      continue
    }
    for (const [field, fieldLabel] of ROOM_FIELDS) {
      if (sameValue(old[field], room[field])) continue
      const show = field === 'price' ? (v) => (isEmpty(v) ? '' : formatAr(v)) : (v) => v
      out.push(change('rooms', `Chambre — ${name} : ${fieldLabel}`, 'changed', show(old[field]), show(room[field])))
    }
  }
  for (const room of b) {
    if (!afterIds.has(room.id)) out.push(change('rooms', `Chambre — ${room.name || room.id}`, 'removed', room.name || room.id, null))
  }
  if (orderChanged(b.map((r) => r.id), a.map((r) => r.id))) out.push({ section: 'rooms', label: 'Ordre des chambres', kind: 'changed' })
  return out
}

/** Différence de multi-ensembles : éléments retirés et ajoutés (doublons comptés). */
function multisetDiff(before, after) {
  const remaining = [...after]
  const removed = []
  for (const item of before) {
    const index = remaining.indexOf(item)
    if (index === -1) removed.push(item)
    else remaining.splice(index, 1)
  }
  return { removed, added: remaining }
}

function diffLists(before, after) {
  const b = obj(before)
  const a = obj(after)
  const out = []
  for (const key of unionKeys(b, a, Object.keys(LIST_LABELS))) {
    const label = LIST_LABELS[key] ?? key
    const old = arr(b[key])
    const next = arr(a[key])
    const { removed, added } = multisetDiff(old, next)
    for (const item of removed) out.push(change('lists', label, 'removed', item, null))
    for (const item of added) out.push(change('lists', label, 'added', null, item))
    if (orderChanged(old, next)) out.push({ section: 'lists', label: `${label} — ordre modifié`, kind: 'changed' })
  }
  return out
}

function diffFaqs(before, after) {
  const b = arr(before)
  const a = arr(after)
  const out = []
  const beforeByQuestion = new Map(b.map((f) => [f.question, f]))
  const afterQuestions = new Set(a.map((f) => f.question))
  for (const faq of a) {
    const old = beforeByQuestion.get(faq.question)
    const label = `FAQ — ${faq.question}`
    if (!old) out.push(change('faqs', label, 'added', null, faq.answer))
    else if (old.answer !== faq.answer) out.push(change('faqs', label, 'changed', old.answer, faq.answer))
  }
  for (const faq of b) {
    if (!afterQuestions.has(faq.question)) out.push(change('faqs', `FAQ — ${faq.question}`, 'removed', faq.answer, null))
  }
  if (orderChanged(b.map((f) => f.question), a.map((f) => f.question))) {
    out.push({ section: 'faqs', label: 'FAQ — ordre des questions', kind: 'changed' })
  }
  return out
}

function diffPages(before, after) {
  const b = arr(before)
  const a = arr(after)
  const out = []
  const beforeByPath = new Map(b.map((p) => [p.path, p]))
  const afterPaths = new Set(a.map((p) => p.path))
  for (const page of a) {
    const old = beforeByPath.get(page.path)
    if (!old) {
      out.push(change('pages', `Page ${page.path}`, 'added', null, page.title))
      continue
    }
    for (const [field, fieldLabel] of PAGE_FIELDS) {
      if (!sameValue(old[field], page[field])) out.push(change('pages', `Page ${page.path} — ${fieldLabel}`, 'changed', old[field], page[field]))
    }
  }
  for (const page of b) {
    if (!afterPaths.has(page.path)) out.push(change('pages', `Page ${page.path}`, 'removed', page.title, null))
  }
  return out
}

function diffPhotos(before, after) {
  const b = arr(before)
  const a = arr(after)
  const out = []
  const beforeByKey = new Map(b.map((p) => [p.key, p]))
  const afterKeys = new Set(a.map((p) => p.key))
  for (const photo of a) {
    const old = beforeByKey.get(photo.key)
    if (!old) {
      out.push(change('photos', `Photo — ${photo.key}`, 'added', null, photo.alt))
      continue
    }
    for (const [field, fieldLabel] of PHOTO_FIELDS) {
      if (!sameValue(old[field], photo[field])) out.push(change('photos', `Photo — ${photo.key} : ${fieldLabel}`, 'changed', old[field], photo[field]))
    }
  }
  for (const photo of b) {
    if (!afterKeys.has(photo.key)) out.push(change('photos', `Photo — ${photo.key}`, 'removed', photo.alt, null))
  }
  return out
}

/** Surcharges (objet clé → valeur) : ajoutée = surcharge posée, retirée = retour au défaut. */
function diffOverrides(section, before, after, labelFor) {
  const b = obj(before)
  const a = obj(after)
  const out = []
  for (const key of unionKeys(b, a)) {
    const had = Object.hasOwn(b, key)
    const has = Object.hasOwn(a, key)
    if (had && has && sameValue(b[key], a[key])) continue
    out.push(change(section, labelFor(key), !had ? 'added' : !has ? 'removed' : 'changed', b[key], a[key]))
  }
  return out
}

const photoSlotByKey = new Map(photoSlots.map((slot) => [slot.key, slot]))
const textSlotByKey = new Map(textSlots.map((slot) => [slot.key, slot]))

const photoSlotLabel = (key) => `Emplacement photo — ${photoSlotByKey.get(key)?.label ?? key}`
const textLabel = (key) => {
  const slot = textSlotByKey.get(key)
  return `Texte — ${slot ? `${PAGE_LABELS[slot.page] ?? slot.page} : ${slot.label}` : key}`
}

/**
 * Liste lisible des différences entre le contenu publié (`before`, ou `null` si rien n'est publié) et le brouillon.
 * `version` est ignorée.
 * @param {object | null} before
 * @param {object} after
 * @returns {Change[]}
 */
export function diffContent(before, after) {
  const b = obj(before)
  const a = obj(after)
  return [
    ...diffSettings(b.settings, a.settings),
    ...diffPrices(b.prices, a.prices),
    ...diffRooms(b.rooms, a.rooms),
    ...diffLists(b.lists, a.lists),
    ...diffFaqs(b.faqs, a.faqs),
    ...diffPages(b.pages, a.pages),
    ...diffPhotos(b.photos, a.photos),
    ...diffOverrides('photoSlots', b.photoSlots, a.photoSlots, photoSlotLabel),
    ...diffOverrides('texts', b.texts, a.texts, textLabel),
  ]
}

/**
 * Phrase du bandeau d'accueil.
 * @param {number} count Nombre de modifications non publiées.
 * @param {boolean} hasPublished Vrai si une version publiée existe.
 * @returns {string}
 */
export function modificationsLabel(count, hasPublished) {
  const base =
    count === 0
      ? 'Aucune modification à publier'
      : `${count} modification${count > 1 ? 's' : ''} non publiée${count > 1 ? 's' : ''}`
  if (hasPublished) return base
  return `Aucune version publiée pour l’instant : ${base.charAt(0).toLowerCase()}${base.slice(1)}`
}
