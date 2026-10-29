// Validation de saisie du tableau de bord (fonctions pures, sans accès réseau).
// Les erreurs sont des messages courts en français, affichés tels quels à côté du champ.

const MAX_AMOUNT = 100_000_000
const MAX_COUNT = 1_000_000

const fr = (n) => n.toLocaleString('fr-FR').replace(/[\u00A0\u202F]/g, ' ')

/** Espaces, espaces insécables et fines insécables (séparateurs de milliers). */
const SEPARATORS = /[\s\u00A0\u202F]/g

/**
 * Convertit une saisie en entier positif ou nul ; `suffix` retire un suffixe d'unité optionnel.
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
function parseInteger(input, { min, max, suffix = null, noun, negative }) {
  let value
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return { ok: false, error: `Saisissez ${noun} valide.` }
    if (!Number.isInteger(input)) return { ok: false, error: 'Saisissez un nombre entier, sans virgule.' }
    value = input
  } else if (typeof input === 'string') {
    let text = input.trim()
    if (suffix) text = text.replace(suffix, '')
    text = text.replace(SEPARATORS, '')
    if (text === '') return { ok: false, error: `Saisissez ${noun}.` }
    if (/^-\d/.test(text)) return { ok: false, error: negative }
    if (/^\d+[.,]\d*$/.test(text)) return { ok: false, error: 'Saisissez un nombre entier, sans virgule.' }
    if (!/^\d+$/.test(text)) return { ok: false, error: `Saisissez ${noun} valide, avec des chiffres uniquement.` }
    value = Number(text)
  } else {
    return { ok: false, error: `Saisissez ${noun}.` }
  }
  if (value < min) return { ok: false, error: `Le nombre doit être au moins ${fr(min)}.` }
  if (value > max) return { ok: false, error: `Le nombre ne peut pas dépasser ${fr(max)}.` }
  return { ok: true, value }
}

/**
 * Montant en ariary : `150000`, `'150 000'`, `'150 000 Ar'` ; entier de 0 à 100 000 000.
 * @param {string | number} input
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
export function parseAmount(input) {
  return parseInteger(input, {
    min: 0,
    max: MAX_AMOUNT,
    suffix: /ar$/i,
    noun: 'un montant',
    negative: 'Le montant ne peut pas être négatif.',
  })
}

/**
 * Entier (nombre d'invités, heure, abonnés…) dans les bornes données.
 * @param {string | number} input
 * @param {{ min?: number, max?: number }} [bounds]
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
export function parseCount(input, { min = 0, max = MAX_COUNT } = {}) {
  return parseInteger(input, { min, max, noun: 'un nombre', negative: `Le nombre doit être au moins ${fr(min)}.` })
}

/** @returns {string | null} Message d'erreur, ou `null` si l'adresse est valide. */
export function validateUrl(input) {
  const text = typeof input === 'string' ? input.trim() : ''
  if (text === '') return 'Adresse requise'
  if (/\s/.test(text)) return 'L’adresse ne doit pas contenir d’espace.'
  let url
  try {
    url = new URL(text)
  } catch {
    return 'Adresse invalide : elle doit commencer par https://'
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'Adresse invalide : elle doit commencer par https://'
  if (!url.hostname) return 'Adresse invalide : le nom du site est manquant.'
  return null
}

/** @returns {string | null} */
export function validateEmail(input) {
  const text = typeof input === 'string' ? input.trim() : ''
  if (text === '') return 'Adresse e-mail requise'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(text)) return 'Adresse e-mail invalide (exemple : nom@exemple.com).'
  return null
}

/** @returns {string | null} */
export function validatePhone(input) {
  const text = typeof input === 'string' ? input.trim() : ''
  if (text === '') return 'Numéro de téléphone requis'
  if (!/^\+?[\d\s().-]+$/.test(text.replace(/[\u00A0\u202F]/g, ' '))) {
    return 'Numéro invalide : chiffres, espaces et + uniquement.'
  }
  if (text.replace(/\D/g, '').length < 8) return 'Numéro trop court (8 chiffres au minimum).'
  return null
}

/** Nombre décimal saisi en nombre ou en texte (virgule acceptée) ; `NaN` si invalide. */
function toDecimal(input) {
  if (typeof input === 'number') return input
  if (typeof input !== 'string' || input.trim() === '') return NaN
  const text = input.trim().replace(',', '.')
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN
}

/** @returns {string | null} */
export function validateCoordinates(lat, lng) {
  const latitude = toDecimal(lat)
  const longitude = toDecimal(lng)
  if (!Number.isFinite(latitude)) return 'Latitude invalide : saisissez un nombre (exemple : -18.945199).'
  if (!Number.isFinite(longitude)) return 'Longitude invalide : saisissez un nombre (exemple : 47.431368).'
  if (latitude < -90 || latitude > 90) return 'La latitude doit être comprise entre -90 et 90.'
  if (longitude < -180 || longitude > 180) return 'La longitude doit être comprise entre -180 et 180.'
  return null
}

/** Conversion décimale partagée avec les formulaires (latitude, longitude). */
export { toDecimal }
