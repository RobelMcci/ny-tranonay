// Photos : conversion ligne SQL ⇄ photo, validation des métadonnées et usages d'une photo.
// Fonctions pures, sans accès réseau.

export const MAX_ALT = 200
export const MAX_CATEGORY = 40
export const MAX_GALLERY_POSITION = 999

/**
 * @typedef {object} Photo
 * @property {string} key
 * @property {string | null} file Chemin sans extension sous src/assets (photos du seed), `null` pour une photo téléversée.
 * @property {string | null} storagePath Objet du bucket `photos` (photos téléversées).
 * @property {string} alt
 * @property {string} category
 * @property {number} width
 * @property {number} height
 * @property {number | null} galleryPosition `null` = absente de la galerie.
 * @property {boolean} visible
 */

/** @returns {Photo} */
export function photoFromRow(row) {
  return {
    key: row.key,
    file: row.file ?? null,
    storagePath: row.storage_path ?? null,
    alt: row.alt,
    category: row.category,
    width: row.width,
    height: row.height,
    galleryPosition: row.gallery_position ?? null,
    visible: row.visible,
  }
}

/** @param {Photo} photo */
export function photoToRow(photo) {
  return {
    key: photo.key,
    file: photo.file,
    storage_path: photo.storagePath,
    alt: photo.alt,
    category: photo.category,
    width: photo.width,
    height: photo.height,
    gallery_position: photo.galleryPosition,
    visible: photo.visible,
  }
}

/**
 * Rang de galerie saisi : vide ou `null` = hors galerie ; sinon entier de 0 à 999 (nombre ou texte).
 * @returns {{ ok: true, value: number | null } | { ok: false, error: string }}
 */
export function parseGalleryPosition(input) {
  if (input === null || input === undefined) return { ok: true, value: null }
  const text = typeof input === 'number' ? (Number.isFinite(input) ? String(input) : 'x') : String(input).trim()
  if (text === '') return { ok: true, value: null }
  if (/^-?\d+[.,]\d*$/.test(text)) return { ok: false, error: 'Le rang doit être un nombre entier, sans virgule.' }
  if (!/^\d+$/.test(text)) return { ok: false, error: 'Le rang doit être un nombre entier de 0 à 999 (laissez vide pour retirer la photo de la galerie).' }
  const value = Number(text)
  if (value > MAX_GALLERY_POSITION) return { ok: false, error: `Le rang doit être compris entre 0 et ${MAX_GALLERY_POSITION}.` }
  return { ok: true, value }
}

/**
 * Contrôle les métadonnées d'une photo ; renvoie un message par champ en erreur.
 * @param {{ alt: string, category: string, galleryPosition?: string | number | null }} meta
 * @returns {Record<string, string>}
 */
export function validatePhotoMeta({ alt, category, galleryPosition }) {
  const errors = {}
  const altText = String(alt ?? '').trim()
  if (altText === '') errors.alt = 'Le texte alternatif est obligatoire : décrivez la photo pour les personnes qui ne la voient pas.'
  else if (altText.length > MAX_ALT) errors.alt = `Le texte alternatif ne peut pas dépasser ${MAX_ALT} caractères.`

  const categoryText = String(category ?? '').trim()
  if (categoryText === '') errors.category = 'La catégorie est obligatoire.'
  else if (categoryText.length > MAX_CATEGORY) errors.category = `La catégorie ne peut pas dépasser ${MAX_CATEGORY} caractères.`

  const position = parseGalleryPosition(galleryPosition)
  if (!position.ok) errors.galleryPosition = position.error
  return errors
}

/** Photo → valeurs de formulaire (rang en texte). */
export function formFromPhoto(photo) {
  return { alt: photo.alt, category: photo.category, galleryPosition: photo.galleryPosition === null ? '' : String(photo.galleryPosition), visible: photo.visible }
}

/** Valeurs de formulaire valides → métadonnées enregistrables. À n'appeler qu'après `validatePhotoMeta`. */
export function photoMetaFromForm(form) {
  return {
    alt: String(form.alt).trim(),
    category: String(form.category).trim(),
    galleryPosition: parseGalleryPosition(form.galleryPosition).value,
    visible: form.visible,
  }
}

/**
 * Une photo est « modifiée » si sa saisie diffère de la version enregistrée (`base`) ou est invalide (à corriger).
 * @param {{ base: Photo, form: ReturnType<typeof formFromPhoto> }} entry
 */
export function isPhotoDirty({ base, form }) {
  if (Object.keys(validatePhotoMeta(form)).length > 0) return true
  const meta = photoMetaFromForm(form)
  return meta.alt !== base.alt || meta.category !== base.category || meta.galleryPosition !== base.galleryPosition || meta.visible !== base.visible
}

/** Catégories distinctes, triées. */
export function categoriesOf(photos) {
  return [...new Set(photos.map((photo) => photo.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
}

/**
 * Photo effective d'un emplacement : la surcharge si elle existe, sinon la photo par défaut.
 * @param {{ key: string, default: string }} slot
 * @param {Record<string, string>} overrides emplacement → clé de photo
 */
export function effectiveSlotPhoto(slot, overrides) {
  const overridden = Object.prototype.hasOwnProperty.call(overrides ?? {}, slot.key)
  return { photoKey: overridden ? overrides[slot.key] : slot.default, overridden }
}

/**
 * Où une photo est utilisée (et ne peut donc être ni masquée ni supprimée).
 * @param {object} options
 * @param {string} options.photoKey
 * @param {Record<string, string>} [options.slots] surcharges publiées ou enregistrées : emplacement → photo
 * @param {Array<{ key: string, label: string, default: string }>} [options.defaults] définitions des emplacements (`photoSlots`)
 * @param {Array<{ name: string, photoKeys: string[] }>} [options.rooms] toutes les chambres, visibles ou non
 * @param {Array<{ photoKey: string, where: string }>} [options.fixedKeys] usages fixes (`fixedPhotoUsages`)
 * @returns {{ usages: string[], blocking: boolean }}
 */
export function photoUsages({ photoKey, slots = {}, defaults = [], rooms = [], fixedKeys = [] }) {
  const usages = []
  for (const slot of defaults) {
    const { photoKey: current, overridden } = effectiveSlotPhoto(slot, slots)
    if (current === photoKey) usages.push(`Emplacement « ${slot.label} » (${overridden ? 'photo choisie' : 'photo par défaut'})`)
  }
  for (const room of rooms) {
    if (room.photoKeys?.includes(photoKey)) usages.push(`Chambre « ${room.name} »`)
  }
  for (const fixed of fixedKeys) {
    if (fixed.photoKey === photoKey) usages.push(`Emplacement fixe du site (${fixed.where})`)
  }
  return { usages, blocking: usages.length > 0 }
}

/**
 * Raison de refuser de masquer (`hide`) ou de supprimer (`delete`) une photo, ou `null` si c'est permis.
 * Une photo à emplacement fixe est toujours refusée ; sinon tout usage (emplacement, chambre) bloque.
 * @param {Parameters<typeof photoUsages>[0] & { action: 'hide' | 'delete' }} options
 * @returns {string | null} message en français
 */
export function photoChangeBlock({ action, ...options }) {
  const wheres = (options.fixedKeys ?? []).filter((fixed) => fixed.photoKey === options.photoKey).map((fixed) => fixed.where)
  if (wheres.length > 0) {
    return `Cette photo est utilisée à un emplacement fixe du site (${wheres.join(', ')}) : elle ne peut pas être masquée ni supprimée.`
  }
  const { usages, blocking } = photoUsages(options)
  if (!blocking) return null
  const verb = action === 'delete' ? 'supprimer' : 'masquer'
  return `Cette photo est utilisée : ${usages.join(', ')}. Remplacez-la ou retirez-la à ces endroits avant de la ${verb}.`
}
