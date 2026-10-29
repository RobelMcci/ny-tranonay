import { formatAr } from './format.js'

const TOKEN = /\{\{\s*([a-z0-9_.]+)\s*\}\}/g

/**
 * Variables de texte disponibles pour un contenu :
 * `prix.<clé>`, `chambre_min`, `chambre_max`, `tel`, `email`, `horaires`, `checkin`, `checkout`.
 * @param {object} content Contenu (voir le contrat `Content`).
 * @returns {Record<string, string>}
 */
export function buildVars(content) {
  const vars = {}
  for (const price of content.prices ?? []) {
    vars[`prix.${price.key}`] = price.unit === 'personnes' ? String(price.amount) : formatAr(price.amount)
  }

  const roomPrices = (content.rooms ?? []).map((room) => room.price)
  vars.chambre_min = roomPrices.length ? formatAr(Math.min(...roomPrices)) : '—'
  vars.chambre_max = roomPrices.length ? formatAr(Math.max(...roomPrices)) : '—'

  const settings = content.settings ?? {}
  vars.tel = settings.phone
  vars.email = settings.email
  vars.horaires = settings.hoursLabel
  vars.checkin = settings.roomCheckIn
  vars.checkout = settings.roomCheckOut
  return vars
}

const isKnown = (vars, name) => Object.hasOwn(vars, name) && vars[name] !== undefined

/**
 * Remplace `{{nom}}` par sa valeur. Lève une erreur si une variable est inconnue.
 * @param {string} text
 * @param {Record<string, string>} vars
 * @returns {string}
 */
export function interpolate(text, vars) {
  return text.replace(TOKEN, (_match, name) => {
    if (!isKnown(vars, name)) throw new Error(`Variable inconnue : {{${name}}}`)
    return vars[name]
  })
}

/**
 * Noms de variables inconnues d'un texte, uniques, dans l'ordre d'apparition.
 * @param {string} text
 * @param {Record<string, string>} vars
 * @returns {string[]}
 */
export function unknownTokens(text, vars) {
  const unknown = []
  for (const [, name] of text.matchAll(TOKEN)) {
    if (!isKnown(vars, name) && !unknown.includes(name)) unknown.push(name)
  }
  return unknown
}
