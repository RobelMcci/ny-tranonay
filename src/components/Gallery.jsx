import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { galleryKeys, photos } from '../lib/images.js'
import Photo from './Photo.jsx'

function Lightbox({ items, index, onClose, onMove }) {
  const ref = useRef(null)
  const photo = photos[items[index]]

  // <dialog> natif : piège le focus, Échap ferme, restaure le focus à la fermeture.
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') onMove(1)
      if (e.key === 'ArrowLeft') onMove(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onMove])

  const btn = 'touch-target absolute flex items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#2B211B] shadow-lg hover:bg-white'

  return (
    <dialog
      ref={ref}
      aria-label="Agrandissement de la photo"
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/85"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <button type="button" className={`${btn} right-4 top-4 h-11 w-11`} onClick={() => ref.current.close()} aria-label="Fermer">✕</button>
        <button type="button" className={`${btn} left-3 top-1/2 h-11 w-11 -translate-y-1/2`} onClick={() => onMove(-1)} aria-label="Photo précédente">‹</button>
        <button type="button" className={`${btn} right-3 top-1/2 h-11 w-11 -translate-y-1/2`} onClick={() => onMove(1)} aria-label="Photo suivante">›</button>
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="100vw"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
        />
        <p className="max-w-2xl text-center text-sm text-white/90">{photo.alt}</p>
      </div>
    </dialog>
  )
}

/** Galerie filtrable par catégorie, avec visionneuse. */
export default function Gallery({ keys = galleryKeys, limit = 0 }) {
  const categories = useMemo(() => ['Tous', ...new Set(keys.map((k) => photos[k].category))], [keys])
  const [filter, setFilter] = useState('Tous')
  const [openIndex, setOpenIndex] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const visible = useMemo(() => keys.filter((k) => filter === 'Tous' || photos[k].category === filter), [keys, filter])

  const collapsed = limit > 0 && !expanded && filter === 'Tous'
  const shown = collapsed ? visible.slice(0, limit) : visible

  const move = useCallback(
    (step) => setOpenIndex((i) => (i === null ? i : (i + step + visible.length) % visible.length)),
    [visible.length],
  )

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrer les photos">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={filter === cat}
            onClick={() => setFilter(cat)}
            className={`touch-target rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === cat ? 'bg-[#C2410C] text-white' : 'bg-white text-[#2B211B] ring-1 ring-black/10 hover:bg-[#C2410C]/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ul className="mt-8 columns-2 gap-3 md:columns-3 lg:columns-4">
        {shown.map((key, i) => (
          <li key={key} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group block w-full overflow-hidden rounded-2xl bg-slate-200"
              aria-label={`Agrandir : ${photos[key].alt}`}
            >
              <Photo
                name={key}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="h-auto w-full transition duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {collapsed && visible.length > limit && (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setExpanded(true)} className="btn-outline">
            Voir les {visible.length} photos
          </button>
        </div>
      )}

      {openIndex !== null && <Lightbox items={visible} index={openIndex} onClose={() => setOpenIndex(null)} onMove={move} />}
    </div>
  )
}
