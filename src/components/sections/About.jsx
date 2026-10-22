import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { aboutHighlights, revealVariant, staggerContainer } from '../../data/content'
import IconBadge from '../ui/IconBadge'
import maison from '../../assets/image15.jpg'

function About() {
  return (
    <section id="about" className="section-min section-pattern bg-brand-cream content-visibility-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2 variants={revealVariant} className="section-title">
              Un lieu complet pour se détendre et célébrer
            </motion.h2>

            <motion.p variants={revealVariant} className="section-subtitle">
              Tranonay est un espace de loisir multifonctionnel à Ambohimasina, conçu pour les
              familles, entreprises et groupes d&apos;amis. Ici, chaque zone est pensée pour la
              convivialité et la détente.
            </motion.p>

            <motion.div variants={revealVariant} className="mt-8 grid gap-4 sm:grid-cols-2">
              {aboutHighlights.map((item) => (
                <div key={item.title} className="card-surface flex gap-3">
                  <IconBadge icon={item.icon} />
                  <div>
                    <h3 className="text-base font-semibold text-[#2B211B]">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Local SEO Badge */}
            <motion.div variants={revealVariant} className="mt-8 flex flex-wrap gap-2">
              <span className="local-badge">
                <MapPin size={12} className="mr-1 inline" aria-hidden="true" />
                Ambohimasina
              </span>
              <span className="local-badge">
                <MapPin size={12} className="mr-1 inline" aria-hidden="true" />
                Votovorona
              </span>
              <span className="local-badge">
                <MapPin size={12} className="mr-1 inline" aria-hidden="true" />
                CUR
              </span>
              <span className="local-badge">🇲🇬 Madagascar</span>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="sticky top-24 aspect-[4/5] overflow-hidden rounded-3xl">
              <img
                src={maison}
                alt="Espace loisirs Ambohimasina"
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-xl font-semibold">Espace loisirs Ambohimasina</h3>
                <p className="mt-2 text-sm text-white/80">Jardin, piscine, salle événement, grillades</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
