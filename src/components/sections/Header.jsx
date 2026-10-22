import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { logo, navLinks } from '../../data/content'
import { scrollToSection } from '../../utils/scrollTo'

function Header({ activeSection }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleClick = (e, href) => {
    setMenuOpen(false)
    scrollToSection(e, href)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/30 bg-white/90 backdrop-blur-lg shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:py-4">
        <a
          href="#hero"
          className="flex items-center gap-2 text-lg font-bold text-[#2B211B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] focus-visible:ring-offset-2 rounded-full"
          onClick={(e) => handleClick(e, '#hero')}
        >
          <motion.img
            src={logo}
            alt="Tranonay"
            className="h-10 w-10 rounded-full object-cover shadow-md"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <span className="hidden font-display sm:inline">Tranonay</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks
            .filter((link) => link.href !== '#contact')
            .map((link) => {
              const isActive = activeSection === link.href.slice(1)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`nav-link relative text-sm font-medium ${isActive ? 'text-[#C2410C]' : ''}`}
                  onClick={(e) => handleClick(e, link.href)}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#C2410C] to-[#047857] transition-all duration-300 ${isActive ? 'w-full' : 'w-0'}`}
                  />
                </a>
              )
            })}
          <a href="#contact" className="btn-primary" onClick={(e) => handleClick(e, '#contact')}>
            Réserver
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="touch-target relative z-50 flex flex-col items-center justify-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <motion.span
            className="h-0.5 w-6 bg-[#2B211B]"
            animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          />
          <motion.span
            className="h-0.5 w-6 bg-[#2B211B]"
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
          />
          <motion.span
            className="h-0.5 w-6 bg-[#2B211B]"
            animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          />
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="absolute inset-x-0 top-full border-t border-slate-200 bg-white shadow-lg md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col p-4">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className={`touch-target flex items-center border-b border-slate-100 py-3 text-base font-medium last:border-0 ${
                    activeSection === link.href.slice(1) ? 'text-[#C2410C]' : 'text-[#2B211B]'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={(e) => handleClick(e, link.href)}
                >
                  {link.label}
                </motion.a>
              ))}
              <a
                href="#contact"
                className="btn-primary mt-4"
                onClick={(e) => handleClick(e, '#contact')}
              >
                Réserver maintenant
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header
