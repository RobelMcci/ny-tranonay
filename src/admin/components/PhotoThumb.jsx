import { useState } from 'react'
import { photoPublicUrl } from '../api.js'

// Vignettes WebP de 192 px des photos du site, indexées par fichier (et non par le registre public de src/lib/images.js,
// qui ne contient que les photos visibles). Requête distincte de celle du site public : aucun module partagé,
// donc aucun changement dans les fichiers ni le HTML des pages publiques.
const seedThumbs = import.meta.glob('../../assets/image*.jpg', {
  query: { w: '192', format: 'webp', quality: 70 },
  eager: true,
  import: 'default',
})

/** Adresse de la vignette : fichier du site (seed), sinon objet du bucket, sinon `null`. */
function thumbUrl(photo) {
  if (photo.file) {
    const url = seedThumbs[`../../assets/${photo.file}.jpg`]
    if (url) return url
  }
  return photo.storagePath ? photoPublicUrl(photo.storagePath) : null
}

/**
 * Vignette carrée à taille fixe (pas de décalage de mise en page). Décorative : le texte alternatif de la photo est
 * affiché en texte à côté. Sans image (ou si elle ne charge pas), un cadre neutre indique la catégorie.
 * @param {{ photo: { file: string | null, storagePath: string | null, category: string }, size?: number }} props
 */
export default function PhotoThumb({ photo, size = 64 }) {
  const url = thumbUrl(photo)
  const [failedUrl, setFailedUrl] = useState(null)
  const style = { width: size, height: size }
  if (!url || failedUrl === url) {
    return (
      <span
        aria-hidden="true"
        style={style}
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200 p-1 text-center text-[10px] font-semibold leading-tight text-slate-700"
      >
        {photo.category}
      </span>
    )
  }
  return <img src={url} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailedUrl(url)} style={style} className="shrink-0 rounded-lg bg-slate-200 object-cover" />
}
