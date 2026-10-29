// Chambres : conversion ligne SQL ⇄ contenu, identifiant (slug) et validation de saisie.
// Fonctions pures, sans accès réseau.
import { parseAmount, parseCount } from './validation.js'

export const MAX_NAME = 80
export const MAX_FEATURES = 20
export const MAX_FEATURE_LENGTH = 80
export const MAX_QUANTITY = 50
const MAX_SLUG = 40
const FALLBACK_SLUG = 'chambre'

/**
 * @typedef {object} Room
 * @property {string} id
 * @property {string} name
 * @property {number} price Prix par nuit en ariary.
 * @property {string[]} features
 * @property {string[]} photoKeys
 * @property {number} quantity
 * @property {number} position
 * @property {boolean} visible
 */

/** @returns {Room} */
export function roomFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price_ar,
    features: Array.isArray(row.features) ? [...row.features] : [],
    photoKeys: Array.isArray(row.photo_keys) ? [...row.photo_keys] : [],
    quantity: row.quantity,
    position: row.position,
    visible: row.visible,
  }
}

/** @param {Room} room */
export function roomToRow(room) {
  return {
    id: room.id,
    name: room.name,
    price_ar: room.price,
    features: [...room.features],
    photo_keys: [...room.photoKeys],
    quantity: room.quantity,
    position: room.position,
    visible: room.visible,
  }
}

/**
 * Identifiant lisible : minuscules, sans accents, tirets entre les mots, 40 caractères au plus.
 * Ajoute `-2`, `-3`… si l'identifiant existe déjà.
 * @param {string} name
 * @param {string[]} existingIds
 */
export function slugify(name, existingIds) {
  const base =
    String(name ?? '')
      .toLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || FALLBACK_SLUG
  const fit = (suffix) => base.slice(0, MAX_SLUG - suffix.length).replace(/-+$/, '') + suffix
  const taken = new Set(existingIds)
  if (!taken.has(fit(''))) return fit('')
  let n = 2
  while (taken.has(fit(`-${n}`))) n += 1
  return fit(`-${n}`)
}

/**
 * Équipements saisis un par ligne (ou déjà en tableau) : lignes nettoyées, lignes vides retirées.
 * @param {string | string[]} input
 * @returns {string[]}
 */
export function parseFeatures(input) {
  const lines = Array.isArray(input) ? input : String(input ?? '').split(/\r\n|\r|\n/)
  return lines.map((line) => String(line).trim()).filter(Boolean)
}

/**
 * Contrôle la saisie d'une chambre ; `price` et `quantity` peuvent être du texte, `features` du texte
 * (une ligne par équipement) ou un tableau. Renvoie un message par champ en erreur.
 * @returns {Record<string, string>}
 */
export function validateRoom(room) {
  const errors = {}
  const name = String(room.name ?? '').trim()
  if (name === '') errors.name = 'Le nom est obligatoire.'
  else if (name.length > MAX_NAME) errors.name = `Le nom ne peut pas dépasser ${MAX_NAME} caractères.`

  const price = parseAmount(room.price)
  if (!price.ok) errors.price = price.error

  const quantity = parseCount(room.quantity, { min: 1, max: MAX_QUANTITY })
  if (!quantity.ok) errors.quantity = quantity.error

  const features = parseFeatures(room.features)
  if (features.length > MAX_FEATURES) errors.features = `${MAX_FEATURES} équipements au maximum (${features.length} saisis).`
  else if (features.some((feature) => feature.length > MAX_FEATURE_LENGTH)) {
    errors.features = `Chaque équipement doit faire ${MAX_FEATURE_LENGTH} caractères au plus.`
  }
  return errors
}

/** Montant lisible avec séparateur de milliers (« 45 000 »). */
export const formatPrice = (amount) => amount.toLocaleString('fr-FR').replace(/[\u00A0\u202F]/g, ' ')

/** Chambre → valeurs de formulaire (texte pour le prix, la quantité et les équipements). */
export function formFromRoom(room) {
  return {
    id: room.id,
    name: room.name,
    price: formatPrice(room.price),
    features: room.features.join('\n'),
    photoKeys: [...room.photoKeys],
    quantity: String(room.quantity),
    position: room.position,
    visible: room.visible,
  }
}

/** Valeurs de formulaire valides → chambre. À n'appeler qu'après `validateRoom`. */
export function roomFromForm(form) {
  return {
    id: form.id,
    name: String(form.name).trim(),
    price: parseAmount(form.price).value,
    features: parseFeatures(form.features),
    photoKeys: [...form.photoKeys],
    quantity: parseCount(form.quantity, { min: 1, max: MAX_QUANTITY }).value,
    position: form.position,
    visible: form.visible,
  }
}

/**
 * Une chambre du formulaire est « modifiée » si elle est nouvelle, invalide (à corriger)
 * ou différente de sa version enregistrée (`base`).
 * @param {{ base: Room | null, form: ReturnType<typeof formFromRoom> }} entry
 */
export function isRoomDirty(entry) {
  const { base, form } = entry
  if (!base) return true
  if (Object.keys(validateRoom(form)).length > 0) return true
  const room = roomFromForm(form)
  return (
    room.name !== base.name ||
    room.price !== base.price ||
    room.quantity !== base.quantity ||
    room.visible !== base.visible ||
    room.features.join('\n') !== base.features.join('\n') ||
    room.photoKeys.join('\n') !== base.photoKeys.join('\n')
  )
}
