import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useBackToTop } from '../../hooks/useScrollSpy'

function BackToTop() {
  const visible = useBackToTop(600)

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="touch-target fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B211B] text-white shadow-soft transition-shadow hover:shadow-xl"
          aria-label="Retour en haut"
        >
          <ArrowUp size={22} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default BackToTop
