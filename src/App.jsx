import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { logo, gallery } from './data/content'
import { useScrollSpy } from './hooks/useScrollSpy'
import Header from './components/sections/Header'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Activities from './components/sections/Activities'
import Gallery from './components/sections/Gallery'
import Pricing from './components/sections/Pricing'
import Faq from './components/sections/Faq'
import Contact from './components/sections/Contact'
import Footer from './components/sections/Footer'
import WhatsAppFloat from './components/sections/WhatsAppFloat'
import BackToTop from './components/sections/BackToTop'
import SectionDivider from './components/ui/SectionDivider'

const sectionIds = ['hero', 'about', 'activities', 'gallery', 'pricing', 'faq', 'contact']

function App() {
  const [loading, setLoading] = useState(true)
  const activeSection = useScrollSpy(sectionIds)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)

    // Préchargement des images critiques
    const criticalImages = gallery.slice(0, 3).map((img) => img.src)
    criticalImages.forEach((src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative text-[#2B211B]">
      {/* Loading Screen */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            className="loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <motion.img
                src={logo}
                alt="Tranonay"
                className="loading-logo mx-auto rounded-full shadow-2xl"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
              <motion.p
                className="mt-4 text-white/80 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Tranonay
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header activeSection={activeSection} />

      <main className="pt-16 md:pt-20">
        <Hero />
        <About />
        <SectionDivider fromColor="#FDF6EC" toColor="#FFFCF8" />
        <Activities />
        <SectionDivider fromColor="#FFFCF8" toColor="#FDF6EC" />
        <Gallery />
        <SectionDivider fromColor="#FDF6EC" toColor="#FFFCF8" />
        <Pricing />
        <SectionDivider fromColor="#FFFCF8" toColor="#FDF6EC" />
        <Faq />
        <SectionDivider fromColor="#FDF6EC" toColor="#FFFCF8" />
        <Contact />
        <SectionDivider fromColor="#FFFCF8" toColor="#2B211B" flip />
      </main>

      <Footer />

      <WhatsAppFloat />
      <BackToTop />
    </div>
  )
}

export default App
