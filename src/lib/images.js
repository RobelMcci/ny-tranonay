// Registre des photos : srcset WebP générés au build par vite-imagetools.
// La liste des photos vient du contenu (site.js) ; seules les images de src/assets/ (image*.jpg du seed)
// et de src/assets/cms/ (photos téléversées, téléchargées par scripts/fetch-content.mjs) sont traitées.
import { photos as photoRows, photoSlots as photoSlotOverrides } from '../data/site.js'
import { photoSlots as photoSlotDefinitions } from '../data/photo-slots.js'
import { buildRegistry, galleryKeysOf, resolvePhoto, roomPhotoKeysOf } from './photo-registry.js'

const srcsets = import.meta.glob('../assets/{image*.jpg,cms/*.jpg}', {
  query: { w: '480;800;1200;1600', format: 'webp', quality: 70, as: 'srcset' },
  eager: true,
  import: 'default',
})
const fallbacks = import.meta.glob('../assets/{image*.jpg,cms/*.jpg}', {
  query: { w: '800', format: 'webp', quality: 70 },
  eager: true,
  import: 'default',
})

/** Registre clé → { src, srcSet, width, height, alt, category } (photos dont le fichier existe). */
export const photos = buildRegistry(photoRows, { srcsets, fallbacks })

const slotDefaults = Object.fromEntries(photoSlotDefinitions.map((slot) => [slot.key, slot.default]))

/** Photos de la galerie, dans l'ordre de `galleryPosition` (puis de la clé). */
export const galleryKeys = galleryKeysOf(photoRows, photos)

/** Photos de la catégorie Chambres, par `galleryPosition` (sans position en dernier) puis clé. */
export const roomPhotoKeys = roomPhotoKeysOf(photoRows, photos)

/** Résout un emplacement (ex. `hero.1`) ou une clé de photo ; ne lève jamais, `undefined` si aucune photo. */
export const photo = (nameOrSlot) => resolvePhoto(nameOrSlot, photos, photoSlotOverrides, slotDefaults)
