import { motion } from 'framer-motion'
import { Calendar, MapPin, MessageCircle, Phone } from 'lucide-react'
import { logo, navLinks, whatsappNumber, whatsappLink } from '../../data/content'
import { scrollToSection } from '../../utils/scrollTo'
import IconBadge from '../ui/IconBadge'

function Footer() {
  return (
    <footer className="footer relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 2px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 rounded-3xl bg-gradient-to-r from-[#C2410C] to-[#047857] p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white md:text-3xl">
            Prêt à vivre une expérience inoubliable ?
          </h3>
          <p className="mt-3 text-white/90">
            Réservez dès maintenant votre événement ou votre journée détente
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, '#contact')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-[#C2410C] transition hover:scale-105 hover:shadow-xl"
            >
              <Calendar size={18} aria-hidden="true" />
              Réserver maintenant
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white hover:text-[#C2410C]"
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Tranonay" className="h-12 w-12 rounded-full object-cover shadow-lg" />
              <h3 className="font-display text-xl font-bold text-white">Tranonay</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              L&apos;espace loisir incontournable à Ambohimasina. Location de salle, activités
              immersives et moments inoubliables à Madagascar.
            </p>

            {/* Social Links */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                Suivez-nous
              </p>
              <div className="flex gap-3">
                <motion.a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#C2410C]"
                >
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </motion.a>
              </div>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Navigation
            </h4>
            <ul className="space-y-3 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center text-white/70 transition hover:text-white"
                    onClick={(e) => scrollToSection(e, link.href)}
                  >
                    <span className="mr-2 transition group-hover:translate-x-1">→</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Contact
            </h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <IconBadge icon={MapPin} size="sm" tone="white" />
                <div>
                  <div className="font-medium text-white">Adresse</div>
                  <div>Ambohimasina, Votovorona</div>
                  <div>CUR, Madagascar</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <IconBadge icon={Phone} size="sm" tone="white" />
                <div>
                  <div className="font-medium text-white">Téléphone</div>
                  <a href={`tel:${whatsappNumber}`} className="hover:text-white transition">
                    +261 34 21 410 31
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Hours Column */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Horaires
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex justify-between">
                <span>Lundi - Vendredi</span>
                <span className="font-medium text-white">8h - 22h</span>
              </li>
              <li className="flex justify-between">
                <span>Samedi</span>
                <span className="font-medium text-white">9h - 23h</span>
              </li>
              <li className="flex justify-between">
                <span>Dimanche</span>
                <span className="font-medium text-white">9h - 20h</span>
              </li>
            </ul>
            <div className="mt-4 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#047857]" />
                <span className="text-white/90">Actuellement ouvert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-xs text-white/50">
              © 2026 Tranonay - Espace Loisir Ambohimasina. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <a href="#" className="text-white/50 transition hover:text-white">
                Mentions légales
              </a>
              <span className="text-white/30">•</span>
              <a href="#" className="text-white/50 transition hover:text-white">
                Politique de confidentialité
              </a>
              <span className="text-white/30">•</span>
              <a href="#" className="text-white/50 transition hover:text-white">
                CGV
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
