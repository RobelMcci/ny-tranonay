import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { faqs, revealVariant, staggerContainer } from '../../data/content'

function Faq() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <section id="faq" className="section-min bg-brand-cream content-visibility-auto">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={revealVariant} className="section-title">
            Questions fréquentes
          </motion.h2>
          <motion.p variants={revealVariant} className="section-subtitle mx-auto">
            Les réponses aux questions qu&apos;on nous pose le plus souvent.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-10 space-y-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {faqs.map((item, index) => {
            const isOpen = openFaq === index
            return (
              <motion.div
                key={item.q}
                variants={revealVariant}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <button
                  type="button"
                  className="touch-target flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-[#2B211B]">{item.q}</span>
                  <Plus
                    size={20}
                    className={`shrink-0 text-[#C2410C] transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export default Faq
