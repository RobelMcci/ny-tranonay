import { photos, photo as resolvePhoto } from '../lib/images.js'
import { roomCardPhoto } from '../lib/photo-registry.js'

/** Image responsive WebP avec dimensions réservées (pas de décalage de mise en page).
 *  `name` : emplacement (`hero.1`) ou clé de photo. Rien n'est rendu si aucune photo n'existe. */
export default function Photo({ name, sizes = '(min-width: 1024px) 33vw, 100vw', priority = false, className = '', alt }) {
  const photo = resolvePhoto(name)
  if (!photo) return null
  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={alt ?? photo.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
    />
  )
}

/** Photo de la carte d'une chambre : première photo choisie dans le tableau de bord, sinon comportement historique. */
export function RoomCardPhoto({ room, ...props }) {
  const name = roomCardPhoto(room, photos)
  return name ? <Photo name={name} {...props} /> : null
}
