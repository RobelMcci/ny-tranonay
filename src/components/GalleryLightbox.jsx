import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

function GalleryLightbox({ images, index, onClose, onNavigate }) {
  const image = images[index]

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onNavigate(1)
      if (event.key === 'ArrowLeft') onNavigate(-1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onNavigate])

  if (!image) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg hover:bg-white"
          aria-label="Fermer la galerie"
        >
          <X size={18} />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onNavigate(-1)}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg hover:bg-white"
              aria-label="Image précédente"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate(1)}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg hover:bg-white"
              aria-label="Image suivante"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <img
          src={image.src}
          alt={image.alt}
          className="h-full max-h-[80vh] w-full object-cover"
          loading="lazy"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{image.alt}</p>
            {image.category && (
              <span className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {image.category}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {index + 1} / {images.length}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GalleryLightbox
