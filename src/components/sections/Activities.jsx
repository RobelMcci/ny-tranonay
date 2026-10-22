import { motion } from 'framer-motion'
import { activities, revealVariant, staggerContainer } from '../../data/content'
import IconBadge from '../ui/IconBadge'

function Activities() {
  return (
    <section id="activities" className="section-min bg-[#FFFCF8] content-visibility-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={revealVariant} className="section-title">
            Nos activités
          </motion.h2>
          <motion.p variants={revealVariant} className="section-subtitle mx-auto">
            15 expériences uniques pour tous les âges : loisirs, nature, événements et détente.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {activities.map((item) => (
            <motion.div
              key={item.title}
              variants={revealVariant}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C2410C] to-[#047857] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />

              <IconBadge icon={item.icon} size="lg" />

              <h3 className="mt-4 text-lg font-semibold text-[#2B211B]">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Activities
