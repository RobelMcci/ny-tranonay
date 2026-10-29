// Correspondance entre la ligne `settings` (snake_case) et `Content.settings` (camelCase),
// valeurs de formulaire (texte) et validation des réglages. Fonctions pures.
import { parseCount, toDecimal, validateCoordinates, validateEmail, validatePhone, validateUrl } from './validation.js'

/** Clé du contrat -> colonne de la table `settings`. */
const COLUMNS = {
  name: 'name',
  tagline: 'tagline',
  phone: 'phone',
  whatsappNumber: 'whatsapp_number',
  email: 'email',
  facebookUrl: 'facebook_url',
  messengerUrl: 'messenger_url',
  facebookFollowers: 'facebook_followers',
  street: 'street',
  city: 'city',
  postalCode: 'postal_code',
  country: 'country',
  countryCode: 'country_code',
  latitude: 'latitude',
  longitude: 'longitude',
  openHour: 'open_hour',
  closeHour: 'close_hour',
  hoursLabel: 'hours_label',
  roomCheckIn: 'room_check_in',
  roomCheckOut: 'room_check_out',
  securitySummary: 'security_summary',
  securityPartnerName: 'security_partner_name',
  securityPartnerUrl: 'security_partner_url',
}

export const SETTINGS_KEYS = Object.keys(COLUMNS)

/** Clés dont la valeur est un nombre dans `Content.settings`. */
const NUMBER_KEYS = ['facebookFollowers', 'latitude', 'longitude', 'openHour', 'closeHour']

/**
 * Clés absentes du formulaire Informations, recopiées telles quelles (sans retouche) à l'enregistrement.
 * `securitySummary` n'est affiché nulle part sur le site : la colonne et sa valeur sont conservées, mais elle ne se
 * modifie plus depuis le tableau de bord.
 */
export const PRESERVED_KEYS = ['securitySummary']

/**
 * @param {object | null | undefined} row Ligne de la table `settings`.
 * @returns {object | null} Réglages au format `Content.settings`, ou `null` sans ligne.
 */
export function settingsFromRow(row) {
  if (!row) return null
  return Object.fromEntries(SETTINGS_KEYS.map((key) => [key, row[COLUMNS[key]]]))
}

/** @returns {object} Ligne prête pour `upsert` (avec `id: 1`). */
export function settingsToRow(settings) {
  return { id: 1, ...Object.fromEntries(SETTINGS_KEYS.map((key) => [COLUMNS[key], settings[key]])) }
}

/** Valeurs de formulaire : tout en texte, champs vides si aucun réglage n'existe encore. */
export function formFromSettings(settings) {
  return Object.fromEntries(SETTINGS_KEYS.map((key) => [key, settings ? String(settings[key] ?? '') : '']))
}

/** Valeurs de formulaire -> `Content.settings` (à appeler une fois `validateSettings` sans erreur). */
export function settingsFromForm(form) {
  const settings = {}
  for (const key of SETTINGS_KEYS) {
    const text = String(form[key] ?? '').trim()
    if (PRESERVED_KEYS.includes(key)) settings[key] = String(form[key] ?? '')
    else if (key === 'latitude' || key === 'longitude') settings[key] = toDecimal(text)
    else if (NUMBER_KEYS.includes(key)) settings[key] = Number(text.replace(/[\s\u00A0\u202F]/g, ''))
    else settings[key] = text
  }
  return settings
}

const text = (value) => (value == null ? '' : String(value)).trim()

/**
 * @param {Record<string, string | number>} settings Réglages (nombres ou texte de formulaire).
 * @returns {Record<string, string>} Erreur française par champ ; objet vide si tout est valide.
 */
export function validateSettings(settings) {
  const errors = {}
  const set = (key, error) => {
    if (error) errors[key] = error
  }

  const required = {
    name: 'Le nom est requis.',
    tagline: 'La phrase d’accroche est requise.',
    street: 'La rue est requise.',
    city: 'La ville est requise.',
    postalCode: 'Le code postal est requis.',
    country: 'Le pays est requis.',
    hoursLabel: 'Le texte des horaires est requis.',
    roomCheckIn: 'L’heure d’arrivée des chambres est requise.',
    roomCheckOut: 'L’heure de départ des chambres est requise.',
  }
  for (const [key, message] of Object.entries(required)) {
    if (text(settings[key]) === '') errors[key] = message
  }

  set('phone', validatePhone(settings.phone))
  set('email', validateEmail(settings.email))
  set('facebookUrl', validateUrl(settings.facebookUrl))
  set('messengerUrl', validateUrl(settings.messengerUrl))

  const whatsapp = text(settings.whatsappNumber)
  if (!/^\d{8,15}$/.test(whatsapp)) {
    errors.whatsappNumber = 'Numéro WhatsApp : 8 à 15 chiffres, sans espace ni « + » (exemple : 261342141031).'
  }

  if (!/^[A-Z]{2}$/.test(text(settings.countryCode))) {
    errors.countryCode = 'Code pays : deux lettres majuscules (exemple : MG).'
  }

  const coordinates = validateCoordinates(settings.latitude, settings.longitude)
  if (coordinates) {
    const field = /^Longitude|^La longitude/.test(coordinates) ? 'longitude' : 'latitude'
    errors[field] = coordinates
  }

  const open = parseCount(settings.openHour, { min: 0, max: 23 })
  const close = parseCount(settings.closeHour, { min: 0, max: 23 })
  if (!open.ok) errors.openHour = open.error
  if (!close.ok) errors.closeHour = close.error
  else if (open.ok && open.value >= close.value) errors.closeHour = 'La fermeture doit être après l’ouverture.'

  const followers = parseCount(settings.facebookFollowers, { min: 0 })
  if (!followers.ok) errors.facebookFollowers = followers.error

  const partnerName = text(settings.securityPartnerName)
  const partnerUrl = text(settings.securityPartnerUrl)
  if (partnerName && !partnerUrl) errors.securityPartnerUrl = 'Adresse requise quand un partenaire est indiqué.'
  else if (partnerUrl) set('securityPartnerUrl', validateUrl(partnerUrl))
  if (partnerUrl && !partnerName) errors.securityPartnerName = 'Nom requis quand une adresse de partenaire est indiquée.'

  return errors
}
