import { lazy, Suspense, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gallery, galleryTileSpans, revealVariant, staggerContainer } from '../../data/content'

const GalleryLightbox = lazy(() => import('../GalleryLightbox'))

function Gallery() {
  const [galleryFilter, setGalleryFilter] = useState('Tous')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const galleryCategories = ['Tous', ...new Set(gallery.map((img) => img.category))]

  const filteredGallery = useMemo(
    () => gallery.filter((img) => galleryFilter === 'Tous' || img.category === galleryFilter),
    [galleryFilter],
  )

  const handleNavigate = (direction) => {
    setLightboxIndex((prev) => {
      if (prev === null) return prev
      const total = filteredGallery.length
      return (prev + direction + total) % total
    })
  }

  return (
    <section id="gallery" className="section-min bg-brand-cream content-visibility-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={revealVariant} className="section-title">
            Galerie immersive
          </motion.h2>
          <motion.p variants={revealVariant} className="section-subtitle mx-auto">
            Découvrez l&apos;ambiance réelle de nos espaces et événements.
          </motion.p>
        </motion.div>

        {/* Gallery Filters */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {galleryCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setGalleryFilter(cat)}
              className={`pill touch-target transition-all ${
                galleryFilter === cat
                  ? 'bg-[#C2410C] text-white'
                  : 'bg-white text-[#2B211B] hover:bg-[#C2410C]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grille bento : tuiles de tailles variées pour un rendu plus éditorial */}
        <motion.div
          className="mt-8 grid auto-rows-[140px] grid-cols-2 gap-4 sm:auto-rows-[180px] sm:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredGallery.map((item, index) => (
            <motion.button
              key={item.src}
              variants={revealVariant}
              className={`gallery-item group relative overflow-hidden rounded-xl ${galleryTileSpans[index % galleryTileSpans.length]}`}
              onClick={() => setLightboxIndex(index)}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="gallery-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <p className="text-sm font-semibold">{item.alt}</p>
                  <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {item.category}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Suspense fallback={null}>
            <GalleryLightbox
              images={filteredGallery}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={handleNavigate}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Gallery
