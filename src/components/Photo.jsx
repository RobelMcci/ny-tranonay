import { photos } from '../lib/images.js'

/** Image responsive WebP avec dimensions réservées (pas de décalage de mise en page). */
export default function Photo({ name, sizes = '(min-width: 1024px) 33vw, 100vw', priority = false, className = '', alt }) {
  const photo = photos[name]
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
