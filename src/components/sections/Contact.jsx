import { motion } from 'framer-motion'
import { MessageCircle, Phone } from 'lucide-react'
import { infoCards, whatsappLink, whatsappNumber, revealVariant, staggerContainer } from '../../data/content'
import IconBadge from '../ui/IconBadge'

function Contact() {
  return (
    <section id="contact" className="section-min bg-[#FFFCF8] content-visibility-auto">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 variants={revealVariant} className="section-title">
            Contact & réservation
          </motion.h2>
          <motion.p variants={revealVariant} className="section-subtitle mx-auto">
            Pas de réservation en ligne : contactez-nous directement par WhatsApp ou par
            téléphone, on s&apos;occupe du reste.
          </motion.p>

          <motion.div variants={revealVariant} className="mx-auto mt-6 flex max-w-md flex-col gap-4 sm:flex-row">
            <a className="btn-primary flex-1" href={whatsappLink} target="_blank" rel="noreferrer">
              <MessageCircle size={18} className="mr-2 inline" aria-hidden="true" />
              WhatsApp
            </a>
            <a className="btn-outline flex-1" href={`tel:${whatsappNumber}`}>
              <Phone size={18} className="mr-2 inline" aria-hidden="true" />
              Appeler
            </a>
          </motion.div>

          <motion.div variants={revealVariant} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {infoCards.map((card) => (
              <div key={card.label} className="card-surface flex flex-col items-center text-center">
                <IconBadge icon={card.icon} />
                <p className="mt-3 text-xs uppercase tracking-widest text-slate-400">{card.label}</p>
                <p className="mt-1 text-lg font-semibold text-[#2B211B]">{card.value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={revealVariant} className="mt-8 overflow-hidden rounded-3xl shadow-soft">
            <div className="map-container h-[300px] w-full">
              <iframe
                title="Carte Ambohimasina"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12598.310260508757!2d47.41825023830235!3d-18.94923142070159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x21fa818b247aa8c3%3A0xc5d001dd1e1ec180!2sAmbohimasina%2C%20Madagascar!5e1!3m2!1sfr!2smu!4v1771236198277!5m2!1sfr!2smu"
                className="h-full w-full"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Contact
