// Préparation des photos avant envoi : redimensionnement (2000 px au plus) et compression JPEG sous 2 Mo.
// `fitWithin`, `planAttempts`, `encodeUnderLimit` et `newPhotoKey` sont purs ; `resizeToJpeg` reçoit les
// adaptateurs du navigateur (décodage, canvas) en troisième argument pour rester testable sous Node.
import { slugify } from './rooms-map.js'

export const MAX_SIDE = 2000
export const MAX_BYTES = 2_000_000
/** Qualités JPEG essayées dans l'ordre, à la taille demandée. */
export const QUALITIES = [0.85, 0.75, 0.65]
/** Dernier recours : taille divisée par deux à cette qualité. */
const LAST_RESORT_QUALITY = 0.7
/** Au-delà, on refuse sans décoder (évite de saturer la mémoire du téléphone). */
const MAX_INPUT_BYTES = 40 * 1024 * 1024

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const TYPE_REFUSALS = {
  'image/heic': 'Le format HEIC (iPhone) n’est pas accepté : exportez la photo en JPEG ou activez « Le plus compatible » dans les réglages de l’appareil photo.',
  'image/heif': 'Le format HEIF (iPhone) n’est pas accepté : exportez la photo en JPEG.',
  'image/gif': 'Les images GIF ne sont pas acceptées : utilisez une photo JPEG, PNG ou WebP.',
  'image/svg+xml': 'Les images SVG ne sont pas acceptées : utilisez une photo JPEG, PNG ou WebP.',
}
const NOT_AN_IMAGE = 'Ce fichier n’est pas une photo acceptée : choisissez une image JPEG, PNG ou WebP.'
const UNREADABLE = 'Impossible de lire cette image : le fichier est peut-être abîmé. Essayez une autre photo.'
const TOO_HEAVY = 'Cette photo est trop lourde : même réduite, elle dépasse 2 Mo. Choisissez une photo moins détaillée ou plus petite.'

/**
 * Message en français quand le fichier n'est pas une photo JPEG, PNG ou WebP, ou `null` s'il est accepté.
 * @param {{ type?: string }} file
 * @returns {string | null}
 */
export function imageTypeError(file) {
  const type = String(file?.type ?? '').toLowerCase()
  if (ACCEPTED_TYPES.includes(type)) return null
  return TYPE_REFUSALS[type] ?? NOT_AN_IMAGE
}

const isDimension = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0

/**
 * Plus grande taille tenant dans un carré de `maxSide` pixels, ratio conservé, jamais agrandie, en entiers (jamais 0).
 * @param {number} width
 * @param {number} height
 * @param {number} maxSide
 * @returns {{ width: number, height: number }}
 */
export function fitWithin(width, height, maxSide) {
  if (!isDimension(width) || !isDimension(height)) throw new Error('Dimensions de l’image invalides.')
  if (!isDimension(maxSide)) throw new Error('Taille maximale invalide.')
  const scale = Math.min(1, maxSide / Math.max(width, height))
  if (scale === 1) return { width: Math.round(width), height: Math.round(height) }
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Essais d'encodage dans l'ordre : chaque qualité à `maxSide`, puis, en dernier recours, la moitié de `maxSide` à 0,7.
 * @param {number} maxSide
 * @returns {{ maxSide: number, quality: number }[]}
 */
export function planAttempts(maxSide) {
  return [...QUALITIES.map((quality) => ({ maxSide, quality })), { maxSide: Math.max(1, Math.floor(maxSide / 2)), quality: LAST_RESORT_QUALITY }]
}

/**
 * Premier résultat d'`encode` qui tient dans `maxBytes`.
 * @template T
 * @param {{ attempts: { maxSide: number, quality: number }[], maxBytes: number,
 *           encode: (attempt: { maxSide: number, quality: number }) => Promise<{ blob: { size: number } } & T> }} options
 * @returns {Promise<{ blob: { size: number } } & T>}
 * @throws {Error} message français quand aucun essai ne passe sous la limite
 */
export async function encodeUnderLimit({ attempts, maxBytes, encode }) {
  for (const attempt of attempts) {
    const result = await encode(attempt)
    if (result.blob.size <= maxBytes) return result
  }
  throw new Error(TOO_HEAVY)
}

/** Adaptateurs du navigateur : décodage (EXIF appliqué) et encodage JPEG sur fond blanc. */
const browserDeps = {
  async decode(file) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(file, { imageOrientation: 'from-image' })
    const url = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      return image
    } finally {
      URL.revokeObjectURL(url)
    }
  },
  async encode(source, { width, height, quality }) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas indisponible')
    context.fillStyle = '#ffffff' // les PNG transparents deviendraient noirs en JPEG
    context.fillRect(0, 0, width, height)
    context.drawImage(source, 0, 0, width, height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('Encodage JPEG impossible')
    return { blob, width, height }
  },
  release(source) {
    source?.close?.()
  },
}

/**
 * Redimensionne une photo (2000 px au plus) et l'encode en JPEG de moins de `maxBytes`.
 * @param {File} file
 * @param {{ maxSide?: number, maxBytes?: number }} [opts]
 * @param {{ decode: (file: File) => Promise<{ width: number, height: number }>,
 *           encode: (source: any, size: { width: number, height: number, quality: number }) => Promise<{ blob: Blob, width: number, height: number }>,
 *           release?: (source: any) => void }} [deps] adaptateurs (navigateur par défaut)
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 * @throws {Error} message français : format refusé, image illisible, ou toujours trop lourde
 */
export async function resizeToJpeg(file, { maxSide = MAX_SIDE, maxBytes = MAX_BYTES } = {}, deps = browserDeps) {
  const typeError = imageTypeError(file)
  if (typeError) throw new Error(typeError)
  if (file.size > MAX_INPUT_BYTES) throw new Error('Cette photo dépasse 40 Mo : choisissez un fichier plus petit.')

  let source
  try {
    source = await deps.decode(file)
    if (!isDimension(source?.width) || !isDimension(source?.height)) throw new Error('dimensions')
  } catch {
    if (source) deps.release?.(source)
    throw new Error(UNREADABLE)
  }
  try {
    return await encodeUnderLimit({
      attempts: planAttempts(maxSide),
      maxBytes,
      encode: async ({ maxSide: side, quality }) => deps.encode(source, { ...fitWithin(source.width, source.height, side), quality }),
    })
  } catch (error) {
    // Message déjà en français (trop lourde) ; toute autre cause (canvas, mémoire) reste générique.
    throw error?.message === TOO_HEAVY ? error : new Error('Impossible de préparer cette photo : réessayez, ou choisissez une autre image.')
  } finally {
    deps.release?.(source)
  }
}

/**
 * Identifiant d'une nouvelle photo, tiré du texte alternatif : `[a-z0-9-]`, 40 caractères au plus, unique parmi
 * `existingKeys` (casse ignorée : la clé sert de nom de fichier au build) grâce à un suffixe `-2`, `-3`…
 * @param {string} alt
 * @param {string[]} existingKeys
 * @returns {string}
 */
export function newPhotoKey(alt, existingKeys) {
  return slugify(alt, existingKeys.map((key) => key.toLowerCase()), { fallback: 'photo' })
}
