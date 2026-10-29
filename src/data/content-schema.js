// Contrat du contenu éditable (instantané publié, seed et sortie de draft_content() ont la même forme).
// Ce fichier ne doit rien importer : il est utilisé côté navigateur, build et scripts Node.

/**
 * @typedef {Object} ContentSettings
 * @property {string} name
 * @property {string} tagline
 * @property {string} phone
 * @property {string} whatsappNumber
 * @property {string} email
 * @property {string} facebookUrl
 * @property {string} messengerUrl
 * @property {number} facebookFollowers
 * @property {string} street
 * @property {string} city
 * @property {string} postalCode
 * @property {string} country
 * @property {string} countryCode
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} openHour
 * @property {number} closeHour
 * @property {string} hoursLabel
 * @property {string} roomCheckIn
 * @property {string} roomCheckOut
 * @property {string} securitySummary
 * @property {string} securityPartnerName
 * @property {string} securityPartnerUrl
 *
 * @typedef {Object} ContentPrice
 * @property {string} key
 * @property {string} label
 * @property {number} amount
 * @property {'ar' | 'personnes'} unit
 *
 * @typedef {Object} ContentRoom
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {string[]} features
 * @property {string[]} photoKeys
 * @property {number} quantity
 *
 * @typedef {Object} ContentFaq
 * @property {string} question
 * @property {string} answer
 *
 * @typedef {Object} ContentPage
 * @property {string} path
 * @property {string} title
 * @property {string} description
 * @property {number} priority
 * @property {string | null} navLabel
 *
 * @typedef {Object} ContentPhoto
 * @property {string} key
 * @property {string | null} file         chemin sans extension sous src/assets/ (ex. `image36`, `cms/<key>`)
 * @property {string | null} storagePath  objet du bucket `photos`
 * @property {string} alt
 * @property {string} category
 * @property {number} width
 * @property {number} height
 * @property {number | null} galleryPosition
 *
 * @typedef {Object} Content
 * @property {string | null} version   id de l'instantané ; null pour le seed ; ajouté au chargement
 * @property {ContentSettings} settings
 * @property {ContentPrice[]} prices
 * @property {ContentRoom[]} rooms
 * @property {{ inclus_privatisation: string[], inclus_reception: string[], extras: string[],
 *   activites: string[], pack_couple: string[], types_evenement: string[] }} lists
 * @property {ContentFaq[]} faqs
 * @property {ContentPage[]} pages
 * @property {ContentPhoto[]} photos
 * @property {Record<string, string>} photoSlots  surcharges seulement (défaut = photo-slots.js)
 * @property {Record<string, string>} texts       surcharges seulement (défaut = text-slots.js)
 */

export const PRICE_KEYS = [
  'privatisation_jour',
  'privatisation_nuit',
  'reception_jour',
  'reception_max_invites',
  'plat_du_jour',
  'plat_complet',
  'pack_couple',
]

export const PRICE_UNITS = ['ar', 'personnes']

export const LIST_KEYS = ['inclus_privatisation', 'inclus_reception', 'extras', 'activites', 'pack_couple', 'types_evenement']

const STRING_SETTINGS = [
  'name', 'tagline', 'phone', 'whatsappNumber', 'email', 'facebookUrl', 'messengerUrl',
  'street', 'city', 'postalCode', 'country', 'countryCode',
  'hoursLabel', 'roomCheckIn', 'roomCheckOut',
  'securitySummary', 'securityPartnerName', 'securityPartnerUrl',
]
const NUMBER_SETTINGS = ['facebookFollowers', 'latitude', 'longitude', 'openHour', 'closeHour']

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isString = (v) => typeof v === 'string'
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== ''
const isNonNegInt = (v) => Number.isInteger(v) && v >= 0
const isStringArray = (v) => Array.isArray(v) && v.every(isString)

/**
 * Valide un contenu. Renvoie la liste des erreurs (vide si valide) ; chaque message cite le chemin du champ fautif.
 * Les clés inconnues sont tolérées (notamment dans `lists`).
 * @param {unknown} content
 * @returns {string[]}
 */
export function validateContent(content) {
  const errors = []
  if (!isObject(content)) return ['contenu : objet attendu']

  if (content.version !== null && content.version !== undefined && !isString(content.version)) {
    errors.push('version : texte ou null attendu')
  }

  // settings
  if (!isObject(content.settings)) {
    errors.push('settings : objet attendu')
  } else {
    for (const k of STRING_SETTINGS) {
      if (!isString(content.settings[k])) errors.push(`settings.${k} : texte attendu`)
    }
    for (const k of NUMBER_SETTINGS) {
      if (typeof content.settings[k] !== 'number' || !Number.isFinite(content.settings[k])) {
        errors.push(`settings.${k} : nombre attendu`)
      }
    }
  }

  // prices
  if (!Array.isArray(content.prices)) {
    errors.push('prices : tableau attendu')
  } else {
    const seen = new Set()
    content.prices.forEach((p, i) => {
      if (!isObject(p)) {
        errors.push(`prices[${i}] : objet attendu`)
        return
      }
      if (!isNonEmptyString(p.key)) errors.push(`prices[${i}].key : texte non vide attendu`)
      else seen.add(p.key)
      if (!isNonEmptyString(p.label)) errors.push(`prices[${i}].label : texte non vide attendu`)
      if (!isNonNegInt(p.amount)) errors.push(`prices[${i}].amount : entier supérieur ou égal à 0 attendu`)
      if (!PRICE_UNITS.includes(p.unit)) errors.push(`prices[${i}].unit : 'ar' ou 'personnes' attendu`)
    })
    for (const key of PRICE_KEYS) {
      if (!seen.has(key)) errors.push(`prices : clé obligatoire manquante « ${key} »`)
    }
  }

  // rooms
  if (!Array.isArray(content.rooms)) {
    errors.push('rooms : tableau attendu')
  } else {
    content.rooms.forEach((r, i) => {
      if (!isObject(r)) {
        errors.push(`rooms[${i}] : objet attendu`)
        return
      }
      if (!isNonEmptyString(r.id)) errors.push(`rooms[${i}].id : texte non vide attendu`)
      if (!isNonEmptyString(r.name)) errors.push(`rooms[${i}].name : texte non vide attendu`)
      if (!isNonNegInt(r.price)) errors.push(`rooms[${i}].price : entier supérieur ou égal à 0 attendu`)
      if (!isStringArray(r.features)) errors.push(`rooms[${i}].features : liste de textes attendue`)
      if (!isStringArray(r.photoKeys)) errors.push(`rooms[${i}].photoKeys : liste de textes attendue`)
      if (!isNonNegInt(r.quantity)) errors.push(`rooms[${i}].quantity : entier supérieur ou égal à 0 attendu`)
    })
  }

  // lists (clés supplémentaires tolérées)
  if (!isObject(content.lists)) {
    errors.push('lists : objet attendu')
  } else {
    for (const k of LIST_KEYS) {
      if (!isStringArray(content.lists[k])) errors.push(`lists.${k} : liste de textes attendue`)
    }
  }

  // faqs
  if (!Array.isArray(content.faqs)) {
    errors.push('faqs : tableau attendu')
  } else {
    content.faqs.forEach((f, i) => {
      if (!isObject(f)) {
        errors.push(`faqs[${i}] : objet attendu`)
        return
      }
      if (!isNonEmptyString(f.question)) errors.push(`faqs[${i}].question : texte non vide attendu`)
      if (!isNonEmptyString(f.answer)) errors.push(`faqs[${i}].answer : texte non vide attendu`)
    })
  }

  // pages
  if (!Array.isArray(content.pages)) {
    errors.push('pages : tableau attendu')
  } else {
    content.pages.forEach((p, i) => {
      if (!isObject(p)) {
        errors.push(`pages[${i}] : objet attendu`)
        return
      }
      if (!isNonEmptyString(p.path)) errors.push(`pages[${i}].path : texte non vide attendu`)
      if (!isString(p.title)) errors.push(`pages[${i}].title : texte attendu`)
      if (!isString(p.description)) errors.push(`pages[${i}].description : texte attendu`)
      if (typeof p.priority !== 'number' || !Number.isFinite(p.priority)) errors.push(`pages[${i}].priority : nombre attendu`)
      if (p.navLabel !== null && !isString(p.navLabel)) errors.push(`pages[${i}].navLabel : texte ou null attendu`)
    })
  }

  // photos
  if (!Array.isArray(content.photos)) {
    errors.push('photos : tableau attendu')
  } else {
    content.photos.forEach((p, i) => {
      if (!isObject(p)) {
        errors.push(`photos[${i}] : objet attendu`)
        return
      }
      if (!isNonEmptyString(p.key)) errors.push(`photos[${i}].key : texte non vide attendu`)
      if (!isNonEmptyString(p.alt)) errors.push(`photos[${i}].alt : texte alternatif non vide obligatoire`)
      const hasFile = isNonEmptyString(p.file)
      const hasStorage = isNonEmptyString(p.storagePath)
      if (!hasFile && !hasStorage) errors.push(`photos[${i}] : « file » ou « storagePath » obligatoire`)
      if (p.file != null && !isString(p.file)) errors.push(`photos[${i}].file : texte ou null attendu`)
      if (p.storagePath != null && !isString(p.storagePath)) errors.push(`photos[${i}].storagePath : texte ou null attendu`)
      if (!isString(p.category)) errors.push(`photos[${i}].category : texte attendu`)
      if (p.galleryPosition !== null && p.galleryPosition !== undefined && !isNonNegInt(p.galleryPosition)) {
        errors.push(`photos[${i}].galleryPosition : entier supérieur ou égal à 0 ou null attendu`)
      }
    })
  }

  // photoSlots, texts
  for (const section of ['photoSlots', 'texts']) {
    if (!isObject(content[section])) {
      errors.push(`${section} : objet attendu`)
    } else {
      for (const [k, v] of Object.entries(content[section])) {
        if (!isString(v)) errors.push(`${section}.${k} : texte attendu`)
      }
    }
  }

  return errors
}
