import { motion } from 'framer-motion'
import { Check, Utensils, Sparkles } from 'lucide-react'
import {
  rentalPackages,
  eventPackage,
  rooms,
  dining,
  amenities,
  revealVariant,
  staggerContainer,
} from '../../data/content'
import { scrollToSection } from '../../utils/scrollTo'
import IconBadge from '../ui/IconBadge'

function Pricing() {
  return (
    <section id="pricing" className="section-min bg-[#FFFCF8] content-visibility-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={revealVariant} className="section-title">
            Tarifs
          </motion.h2>
          <motion.p variants={revealVariant} className="section-subtitle mx-auto">
            Des formules claires pour chaque occasion : journée entre amis, réception formelle ou
            nuit sur place.
          </motion.p>
        </motion.div>

        {/* Journées & soirées privatisées */}
        <h3 className="mt-14 text-center text-lg font-semibold uppercase tracking-wide text-[#C2410C]">
          Journées & soirées privatisées — Tafir
        </h3>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {rentalPackages.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`pricing-card relative rounded-2xl bg-white p-6 shadow-lg ${
                plan.featured ? 'border-2 border-[#C2410C]' : ''
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#C2410C] to-[#047857] px-4 py-1 text-sm font-semibold text-white shadow-lg">
                  🌙 Idéal soirée
                </span>
              )}
              <h4 className="text-xl font-bold text-[#2B211B]">{plan.name}</h4>
              <div className="mt-4">
                <span className="text-3xl font-bold text-[#C2410C]">{plan.price}</span>
                <span className="ml-2 text-sm text-slate-500">{plan.period}</span>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {plan.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-[#047857]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="mt-6 block w-full rounded-xl border-2 border-[#C2410C] py-3 text-center font-semibold text-[#C2410C] transition hover:bg-[#C2410C] hover:text-white"
                onClick={(e) => scrollToSection(e, '#contact')}
              >
                Réserver cette formule
              </a>
            </motion.div>
          ))}
        </div>

        {/* Réception événementielle */}
        <h3 className="mt-14 text-center text-lg font-semibold uppercase tracking-wide text-[#C2410C]">
          Réception événementielle
        </h3>
        <motion.div
          className="mx-auto mt-6 max-w-2xl rounded-2xl bg-gradient-to-br from-[#C2410C] to-[#047857] p-8 text-white shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-xl font-bold">{eventPackage.name}</h4>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm">{eventPackage.capacity}</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold">{eventPackage.price}</span>
            <span className="ml-2 text-sm text-white/80">{eventPackage.period}</span>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {eventPackage.includes.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <Check size={16} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            className="mt-6 block w-full rounded-xl bg-white py-3 text-center font-semibold text-[#C2410C] transition hover:bg-white/90"
            onClick={(e) => scrollToSection(e, '#contact')}
          >
            Demander un devis
          </a>
        </motion.div>

        {/* Chambres */}
        <h3 className="mt-14 text-center text-lg font-semibold uppercase tracking-wide text-[#C2410C]">
          Nos chambres
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
          Check-in à partir de 10h, check-out le lendemain à 10h.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((room, index) => (
            <motion.div
              key={room.name}
              className={`pricing-card relative rounded-2xl bg-white p-5 shadow-lg ${
                room.featured ? 'border-2 border-[#C2410C]' : ''
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <h4 className="text-base font-bold text-[#2B211B]">{room.name}</h4>
              <div className="mt-2">
                <span className="text-2xl font-bold text-[#C2410C]">{room.price}</span>
                <span className="ml-1 text-xs text-slate-500">/nuit</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {room.features.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#047857]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Restauration & équipements */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="card-surface">
            <h4 className="flex items-center gap-2 text-lg font-semibold text-[#2B211B]">
              <IconBadge icon={Utensils} size="sm" />
              Restauration
            </h4>
            <ul className="mt-4 space-y-2">
              {dining.items.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-semibold text-[#C2410C]">{item.price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">{dining.note}</p>
          </div>
          <div className="card-surface">
            <h4 className="flex items-center gap-2 text-lg font-semibold text-[#2B211B]">
              <IconBadge icon={Sparkles} size="sm" tone="forest" />
              Équipements inclus
            </h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {amenities.map((item) => (
                <span key={item.label} className="pill bg-brand-cream">
                  <item.icon size={14} className="mr-1 inline text-[#C2410C]" aria-hidden="true" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
