import { useEffect, useMemo, useState, useRef, lazy, Suspense } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import maison from './assets/image15.jpg'
import evenement3 from './assets/image1.jpg'
import babyfoot from './assets/image2.jpg'
import evenement1 from './assets/image3.jpg'
import evenement2 from './assets/image4.jpg'
import grillades from './assets/image5.jpg'
import nourriture1 from './assets/image6.jpg'
import nourriture2 from './assets/image7.jpg'
import nourriture3 from './assets/image8.jpg'
import nourriture4 from './assets/image9.jpg'
import vuejardin from './assets/image10.jpg'
import jardin2 from './assets/image11.jpg'
import jeuxvideos from './assets/image12.jpg'
import karaoke from './assets/image13.jpg'
import escalier from './assets/image14.jpg'
import logo from './assets/image14.jpg'

// Lazy loading pour les composants moins critiques
const GalleryLightbox = lazy(() => import('./components/GalleryLightbox'))
const TestimonialsCarousel = lazy(() => import('./components/TestimonialsCarousel'))

const activities = [
  { title: 'Location de salle pour événements', desc: 'Espaces modulables avec décoration personnalisée.', icon: '🎉' },
  { title: 'Baby-foot', desc: 'Matches conviviaux et tournois privés.', icon: '⚽' },
  { title: 'Piscine', desc: 'Eau claire, transats et ambiance tropicale.', icon: '🏊' },
  { title: 'Jeux de société', desc: 'Jeux modernes et classiques pour tous.', icon: '🎲' },
  { title: 'Karaoké', desc: 'Soirées chantantes avec sono premium.', icon: '🎤' },
  { title: 'Grillades / Barbecue', desc: 'Atelier grillades encadré.', icon: '🔥' },
  { title: 'Aire jeux vidéo', desc: 'Arcade, consoles & VR conviviale.', icon: '🎮' },
  { title: 'Jardin zen', desc: 'Nature calme pour se ressourcer.', icon: '🌿' },
  { title: 'Team building & EVG/EVJF', desc: 'Formules sur-mesure.', icon: '🤝' },
  { title: 'Anniversaires', desc: 'Forfaits enfants & adultes.', icon: '🎂' },
  { title: 'Soirées à thème', desc: 'Quiz games, karaoké nights.', icon: '✨' },
  { title: 'Coworking calme', desc: 'Espace zen en journée.', icon: '💼' },
  { title: 'Yoga & méditation', desc: 'Dans le jardin au calme.', icon: '🧘' },
  { title: 'Projection plein air', desc: 'Films sous les étoiles.', icon: '🎬' },
  { title: 'Photo booth', desc: 'Souvenirs instantanés.', icon: '📸' },
]

const gallery = [
  { src: maison, alt: 'Vue de la maison', category: 'Piscine' },
  { src: vuejardin, alt: 'Vue du jardin', category: 'Jardin' },
  { src: grillades, alt: 'Espace barbecue', category: 'Grillades' },
  { src: babyfoot, alt: 'Baby-foot', category: 'Jeux' },
  { src: karaoke, alt: 'Karaoké', category: 'Soirée' },
  { src: escalier, alt: 'Escalier', category: 'Espace' },
  { src: jeuxvideos, alt: 'Aire jeux vidéo', category: 'Jeux' },
  { src: nourriture1, alt: 'Nourriture 1', category: 'Nourriture' },
  { src: nourriture2, alt: 'Nourriture 2', category: 'Nourriture' },
  { src: nourriture3, alt: 'Nourriture 3', category: 'Nourriture' },
  { src: nourriture4, alt: 'Nourriture 4', category: 'Nourriture' },
  { src: evenement1, alt: 'Événement privé', category: 'Événement' },
  { src: evenement2, alt: 'Salle événement', category: 'Événement' },
  { src: evenement3, alt: 'Ambiance soirée', category: 'Soirée' },
  { src: jardin2, alt: 'Jardin zen', category: 'Jardin' },
]

const testimonials = [
  { name: 'Aina R.', role: 'Événement privé', rating: 5, quote: 'Un lieu magnifique, le jardin et la piscine ont rendu notre fête inoubliable.', date: 'Mars 2026' },
  { name: 'Mamy L.', role: 'Team building', rating: 5, quote: 'Organisation au top, activités variées et équipe très accueillante.', date: 'Fév 2026' },
  { name: 'Sahondra T.', role: 'Anniversaire', rating: 5, quote: 'Les enfants se sont éclatés, tout était prêt dès notre arrivée.', date: 'Jan 2026' },
  { name: 'Rakoto F.', role: 'EVG', rating: 5, quote: 'Ambiance de folie, le karaoké et le baby-foot ont fait l\'unanimité !', date: 'Déc 2025' },
  { name: 'Hery N.', role: 'Coworking', rating: 4, quote: 'Espace calme et connecté, parfait pour travailler au vert.', date: 'Nov 2025' },
]

const stats = [
  { label: 'Activités & espaces', value: '15+' },
  { label: 'Clients satisfaits', value: '98%' },
]

const pricing = [
  {
    name: 'Journée (10h-19h)',
    price: '200 000 Ar',
    period: '/journée',
    includes: ['Accès piscine & jardin', 'Karaoké', 'Espace jeux', 'Toutes activités incluses', 'Sono & micro', 'Connection Wifi'],
    limited: ['Jusqu\'à 30 personnes'],
  },
  {
    name: 'Journée pour couples',
    price: '100 000 Ar',
    period: 'journée',
    includes: ['Grande Salle privée', 'Baby-foot & karaoké', 'Connexion Wifi inclus', 'Sono & micro'],
    limited: ['par couple (2 personnes)'],
    featured: true,
  },
  {
    name: 'Chambre d\'hôtes',
    price: '60 000 Ar',
    period: 'sur-mesure',
    includes: ['Chambre double avec salle de bain privé', 'Accès piscine & jardin', 'Parking sécurisé'],
    limited: ['1 chambre pour 2 personnes'],
  },
  {
    name: 'Chambre commun',
    price: '50 000 Ar',
    period: 'sur-mesure',
    includes: ['Chambre avec salle de bain commune', 'Accès piscine & jardin', 'Parking sécurisé'],
    limited: ['1 chambre pour 2 personnes'],
  },
]

const teamBuildingActivities = [
  { name: 'Chasse au trésor', duration: '2h', price: '50 000 Ar' },
  { name: 'Tournoi baby-foot', duration: '3h', price: '80 000 Ar' },
  { name: 'Atelier cuisine', duration: '3h', price: '120 000 Ar' },
  { name: 'Karaoké battle', duration: '2h', price: '60 000 Ar' },
]

const revealVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [formStatus, setFormStatus] = useState({ type: '', message: '' })
  const [galleryFilter, setGalleryFilter] = useState('Tous')
  const [videoError, setVideoError] = useState(false)
  
  const heroRef = useRef(null)
  const activitiesRef = useRef(null)
  const formRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  useEffect(() => {
    // Optimisation du chargement initial
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1400)

    // Préchargement des images critiques
    const preloadImages = () => {
      const criticalImages = gallery.slice(0, 3).map(img => img.src)
      criticalImages.forEach(src => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
      })
    }
    preloadImages()

    return () => clearTimeout(timer)
  }, [])

  // Carousel automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  // Smooth scroll pour les ancres
  const handleAnchorClick = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Gestionnaire formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormStatus({ type: 'loading', message: 'Envoi en cours...' })
    
    try {
      const formData = new FormData(e.target)
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      })
      
      if (response.ok) {
        setFormStatus({ type: 'success', message: 'Demande envoyée ! Nous vous rappelons sous 24h.' })
        e.target.reset()
      } else {
        throw new Error('Erreur réseau')
      }
    } catch (error) {
      setFormStatus({ type: 'error', message: 'Une erreur est survenue. Contactez-nous par WhatsApp.' })
    }
  }

  const particlesInit = useMemo(
    () => async (engine) => {
      await loadSlim(engine)
    },
    [],
  )

  const particlesOptions = useMemo(
    () => ({
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      particles: {
        color: { value: ['#10B981', '#DC2626', '#FFFFFF'] },
        links: { enable: false },
        move: { 
          enable: true, 
          speed: 0.6,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'bounce' }
        },
        number: { 
          value: 40,
          density: { enable: true, area: 800 }
        },
        opacity: { 
          value: 0.6,
          random: true,
          animation: { enable: true, speed: 1, minimumValue: 0.3 }
        },
        shape: { type: ['circle', 'leaf'] },
        size: { 
          value: { min: 2, max: 5 },
          random: true,
          animation: { enable: true, speed: 2, minimumValue: 1 }
        },
      },
      detectRetina: true,
    }),
    [],
  )

  const navLinks = [
    { label: 'À propos', href: '#about' },
    { label: 'Activités', href: '#activities' },
    { label: 'Galerie', href: '#gallery' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ]

  const galleryCategories = ['Tous', ...new Set(gallery.map(img => img.category))]

  const filteredGallery = useMemo(
    () => gallery.filter(img => galleryFilter === 'Tous' || img.category === galleryFilter),
    [galleryFilter],
  )

  return (
    <div className="relative text-[#1F2937]">
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
                alt="Ny Tranonay"
                className="loading-logo mx-auto rounded-full shadow-2xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: 'easeInOut',
                }}
              />
              <motion.p 
                className="mt-4 text-white/80 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Tranonay
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Sticky */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/30 bg-white/90 backdrop-blur-lg shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:py-4">
          <a 
            href="#hero" 
            className="flex items-center gap-2 text-lg font-bold text-[#1F2937]"
            onClick={(e) => handleAnchorClick(e, '#hero')}
          >
            <motion.img
              src={logo}
              alt="Ny Tranonay Logo"
              className="h-10 w-10 rounded-full object-cover shadow-md"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <span className="hidden sm:inline">Tranonay</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.filter(link => link.href !== '#contact').map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link relative text-sm font-medium"
                onClick={(e) => handleAnchorClick(e, link.href)}
              >
                {link.label}
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#DC2626] to-[#10B981]"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.2 }}
                />
              </a>
            ))}
            <a
              href="#contact"
              className="btn-primary"
              onClick={(e) => handleAnchorClick(e, '#contact')}
            >
              Réserver
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <motion.span
              className="h-0.5 w-6 bg-[#1F2937]"
              animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            />
            <motion.span
              className="h-0.5 w-6 bg-[#1F2937]"
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            />
            <motion.span
              className="h-0.5 w-6 bg-[#1F2937]"
              animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            />
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              className="absolute inset-x-0 top-full border-t border-slate-200 bg-white/95 backdrop-blur-lg md:hidden"
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
                    className="border-b border-slate-100 py-3 text-base font-medium text-[#1F2937] last:border-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                  >
                    {link.label}
                  </motion.a>
                ))}
                <a
                  href="#contact"
                  className="btn-primary mt-4"
                  onClick={(e) => handleAnchorClick(e, '#contact')}
                >
                  Réserver maintenant
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-16 md:pt-20">
        {/* Hero Section */}
        <section
          id="hero"
          ref={heroRef}
          className="hero-section relative overflow-hidden content-visibility-auto"
        >
          {/* Video Background (optionnel) */}
          {!videoError && (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=70&fm=webp"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setVideoError(true)}
            >
              <source src="/videos/hero-background.mp4" type="video/mp4" />
            </video>
          )}
          
          {/* Fallback Image */}
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${maison}')`,
              opacity: heroOpacity,
              scale: heroScale,
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626]/90 to-[#10B981]/90" />

          {/* Particles */}
          <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />

          {/* Hero Content */}
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-32">
            <motion.div
              className="max-w-3xl"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={revealVariant} className="mb-4">
                <span className="pill bg-white/90 text-[#DC2626]">
                  🇲🇬 Ambohimasina, Votovorona, CUR
                </span>
              </motion.div>

              <motion.h1 
                variants={revealVariant}
                className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl xl:text-7xl"
              >
                L&apos;espace loisir{' '}
                <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  immersif
                </span>
              </motion.h1>

              <motion.p 
                variants={revealVariant}
                className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl"
              >
                Piscine, baby-foot, karaoké, grillades et jardin zen : tout est réuni pour une
                expérience inoubliable à Madagascar.
              </motion.p>

              <motion.div 
                variants={revealVariant}
                className="mt-8 flex flex-wrap gap-4"
              >
                <a
                  href="#contact"
                  className="btn-primary relative overflow-hidden"
                  onClick={(e) => handleAnchorClick(e, '#contact')}
                >
                  <span className="relative z-10">Réserver maintenant</span>
                  <motion.div
                    className="absolute inset-0 bg-white"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ opacity: 0.2 }}
                  />
                </a>
                <a
                  href="#activities"
                  className="btn-outline border-white text-white hover:bg-white hover:text-[#1F2937]"
                  onClick={(e) => handleAnchorClick(e, '#activities')}
                >
                  Découvrir les activités
                </a>
              </motion.div>

              <motion.div 
                variants={revealVariant}
                className="mt-8 flex flex-wrap gap-3"
              >
                <span className="pill">Événements sur-mesure</span>
                <span className="pill">Team building & EVG/EVJF</span>
                <span className="pill">Ambiance nature & calme</span>
              </motion.div>

              {/* Stats */}
              <motion.div 
                variants={revealVariant}
                className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
              >
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm"
                  >
                    <motion.p
                      className="text-2xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="mt-1 text-xs text-white/70">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 lg:block"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="flex h-12 w-8 items-start justify-center rounded-full border-2 border-white/30">
              <motion.div
                className="mt-2 h-2 w-1 rounded-full bg-white"
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </motion.div>
        </section>

        {/* About Section */}
        <section id="about" className="section-min section-pattern bg-slate-50 content-visibility-auto">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={staggerContainer}
              >
                <motion.h2 
                  variants={revealVariant}
                  className="section-title"
                >
                  Un lieu complet pour se détendre et célébrer
                </motion.h2>
                
                <motion.p 
                  variants={revealVariant}
                  className="section-subtitle"
                >
                  Tranonay est un espace de loisir multifonctionnel à Ambohimasina, conçu pour les
                  familles, entreprises et groupes d&apos;amis. Ici, chaque zone est pensée pour la
                  convivialité et la détente.
                </motion.p>

                <motion.div 
                  variants={revealVariant}
                  className="mt-8 grid gap-4 sm:grid-cols-2"
                >
                  {[
                    { title: '📍 Localisation stratégique', desc: 'À 10 min du CUR, accès rapide et sécurisé.' },
                    { title: '🌿 Ambiance nature', desc: 'Jardin luxuriant de 2000m², calme et ressourçant.' },
                    { title: '🤝 Services partenaires', desc: 'Traiteur, photographe, location de matériel.' },
                    { title: '📲 Réservations faciles', desc: 'WhatsApp, téléphone ou formulaire en ligne.' },
                  ].map((item) => (
                    <div key={item.title} className="card-surface">
                      <h3 className="text-lg font-semibold text-[#1F2937]">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Local SEO Badge */}
                <motion.div 
                  variants={revealVariant}
                  className="mt-8 flex flex-wrap gap-2"
                >
                  <span className="local-badge">📍 Ambohimasina</span>
                  <span className="local-badge">📍 Votovorona</span>
                  <span className="local-badge">📍 CUR</span>
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
                <div className="sticky top-24 overflow-hidden rounded-3xl">
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
                    <p className="mt-2 text-sm text-white/80">
                      Jardin, piscine, salle événement, grillades
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Activities Section */}
        <section id="activities" ref={activitiesRef} className="section-min content-visibility-auto">
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
              {activities.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={revealVariant}
                  custom={index}
                  className="activity-card group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm"
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#DC2626] to-[#10B981] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                  
                  <motion.div
                    className="text-4xl"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {item.icon}
                  </motion.div>
                  
                  <h3 className="mt-4 text-lg font-semibold text-[#1F2937]">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                  
                  <motion.span
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#DC2626]"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                  >
                    En savoir plus →
                  </motion.span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Team Building Section */}
        <section className="section-min bg-gradient-to-br from-[#DC2626] to-[#10B981] text-white content-visibility-auto">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-2">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2 
                  variants={revealVariant}
                  className="text-3xl font-bold sm:text-4xl lg:text-5xl"
                >
                  Team Building & EVG/EVJF
                </motion.h2>
                <motion.p 
                  variants={revealVariant}
                  className="mt-4 text-lg text-white/90"
                >
                  Des formules sur-mesure pour vos groupes, avec activités encadrées et espace privatisable.
                </motion.p>

                <motion.div 
                  variants={revealVariant}
                  className="mt-8 space-y-4"
                >
                  {teamBuildingActivities.map((activity) => (
                    <div
                      key={activity.name}
                      className="flex items-center justify-between rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                    >
                      <div>
                        <h3 className="font-semibold">{activity.name}</h3>
                        <p className="text-sm text-white/70">{activity.duration}</p>
                      </div>
                      <span className="text-lg font-bold">{activity.price}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.a
                  variants={revealVariant}
                  href="#contact"
                  className="btn-primary mt-8 inline-block bg-white text-[#DC2626] hover:bg-white/90"
                  onClick={(e) => handleAnchorClick(e, '#contact')}
                >
                  Demander un devis
                </motion.a>
              </motion.div>

              <motion.div
                className="grid gap-4 sm:grid-cols-2"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {[
                  '🎯 Chasse au trésor',
                  '⚽ Baby-foot',
                  '🎤 Karaoké battle',
                  '🍳 Atelier cuisine',
                  '📸 Photo challenge',
                  '🎲 Jeux de société',
                ].map((item) => (
                  <div key={item} className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm">
                    <span className="text-2xl">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="section-min bg-slate-50 content-visibility-auto">
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
                  className={`pill transition-all ${
                    galleryFilter === cat
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-white text-[#1F2937] hover:bg-[#DC2626]/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            <motion.div
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {filteredGallery.map((item) => (
                  <motion.button
                    key={item.src}
                    variants={revealVariant}
                    className="gallery-item group relative aspect-square overflow-hidden rounded-xl"
                    onClick={() => setLightbox(item)}
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
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="section-min bg-slate-50 content-visibility-auto">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.h2 variants={revealVariant} className="section-title">
                Tarifs flexibles
              </motion.h2>
              <motion.p variants={revealVariant} className="section-subtitle mx-auto">
                Des formules adaptées à chaque occasion, avec options personnalisables.
              </motion.p>
            </motion.div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricing.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  className={`pricing-card relative rounded-2xl bg-white p-6 shadow-lg ${
                    plan.featured ? 'scale-105 border-2 border-[#DC2626] lg:scale-110' : ''
                  }`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#DC2626] to-[#10B981] px-4 py-1 text-sm font-semibold text-white shadow-lg">
                      🔥 Populaire
                    </span>
                  )}

                  <h3 className="text-xl font-bold text-[#1F2937]">{plan.name}</h3>
                  
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-[#DC2626]">{plan.price}</span>
                    <span className="ml-2 text-sm text-slate-500">{plan.period}</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.includes.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <span className="text-[#10B981]">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">
                      {plan.limited.map((limit) => (
                        <span key={limit} className="block">📌 {limit}</span>
                      ))}
                    </p>
                  </div>

                  <a
                    href="#contact"
                    className={`mt-6 block w-full rounded-xl py-3 text-center font-semibold transition ${
                      plan.featured
                        ? 'bg-gradient-to-r from-[#DC2626] to-[#10B981] text-white hover:opacity-90'
                        : 'border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white'
                    }`}
                    onClick={(e) => handleAnchorClick(e, '#contact')}
                  >
                    Choisir cette formule
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section-min content-visibility-auto">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-2">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2 variants={revealVariant} className="section-title">
                  Contact & réservation
                </motion.h2>
                <motion.p variants={revealVariant} className="section-subtitle">
                  Réservez votre date ou contactez-nous directement via WhatsApp ou téléphone.
                </motion.p>

                <motion.div 
                  variants={revealVariant}
                  className="mt-6 flex flex-col gap-4 sm:flex-row"
                >
                  <a
                    className="btn-primary flex-1"
                    href="https://wa.me/261342141031"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="mr-2">📱</span>
                    WhatsApp
                  </a>
                  <a
                    className="btn-outline flex-1"
                    href="tel:+261342141031"
                  >
                    <span className="mr-2">📞</span>
                    Appeler
                  </a>
                </motion.div>

                <motion.div 
                  variants={revealVariant}
                  className="mt-6 grid gap-4 sm:grid-cols-2"
                >
                  <div className="card-surface">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Capacité</p>
                    <p className="mt-2 text-lg font-semibold text-[#1F2937]">Jusqu&apos;à 120 pers.</p>
                  </div>
                  <div className="card-surface">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Horaires</p>
                    <p className="mt-2 text-lg font-semibold text-[#1F2937]">08h - 22h</p>
                  </div>
                  <div className="card-surface">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Paiement</p>
                    <p className="mt-2 text-lg font-semibold text-[#1F2937]">Espèces / Mobile money</p>
                  </div>
                  <div className="card-surface">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Wifi</p>
                    <p className="mt-2 text-lg font-semibold text-[#1F2937]">Gratuit haut débit</p>
                  </div>
                </motion.div>

                <motion.div 
                  variants={revealVariant}
                  className="mt-8 overflow-hidden rounded-3xl shadow-soft"
                >
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

              <motion.form
                ref={formRef}
                className="contact-form relative"
                name="reservation"
                method="POST"
                data-netlify="true"
                onSubmit={handleSubmit}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <input type="hidden" name="form-name" value="reservation" />
                
                <motion.h3 
                  variants={revealVariant}
                  className="text-xl font-semibold text-[#1F2937]"
                >
                  Formulaire de réservation
                </motion.h3>

                <motion.p 
                  variants={revealVariant}
                  className="text-sm text-slate-600"
                >
                  Réponse garantie sous 24h
                </motion.p>

                <motion.div variants={revealVariant} className="grid gap-4">
                  <input
                    className="input-field"
                    placeholder="Nom complet *"
                    name="name"
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                  
                  <input
                    className="input-field"
                    placeholder="Email *"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                  
                  <input
                    className="input-field"
                    placeholder="Téléphone *"
                    name="phone"
                    type="tel"
                    required
                    pattern="[0-9+\s]{8,}"
                    autoComplete="tel"
                  />
                  
                  <select
                    className="input-field"
                    name="event"
                    required
                  >
                    <option value="">Type d&apos;événement *</option>
                    <option>Anniversaire</option>
                    <option>Team building</option>
                    <option>EVG/EVJF</option>
                    <option>Soirée à thème</option>
                    <option>Réunion professionnelle</option>
                    <option>Mariage</option>
                    <option>Autre</option>
                  </select>
                  
                  <input
                    className="input-field"
                    name="date"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    autoComplete="off"
                  />
                  
                  <input
                    className="input-field"
                    name="guests"
                    type="number"
                    placeholder="Nombre de personnes"
                    min="1"
                    max="120"
                    autoComplete="off"
                  />
                  
                  <textarea
                    className="input-field min-h-[120px]"
                    name="message"
                    placeholder="Détails de votre demande (optionnel)"
                    maxLength={500}
                    autoComplete="off"
                  />

                  {/* Message de statut */}
                  {formStatus.message && (
                    <motion.div
                      className={`rounded-xl p-3 text-sm ${
                        formStatus.type === 'success'
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : formStatus.type === 'error'
                          ? 'bg-[#DC2626]/10 text-[#DC2626]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {formStatus.message}
                    </motion.div>
                  )}

                  <button
                    className="btn-primary w-full"
                    type="submit"
                    disabled={formStatus.type === 'loading'}
                  >
                    {formStatus.type === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Envoi en cours...
                      </span>
                    ) : (
                      'Envoyer ma demande'
                    )}
                  </button>
                </motion.div>

                {/* Sécurité anti-spam Netlify */}
                <p className="mt-4 text-center text-xs text-slate-400">
                  * Champs obligatoires
                </p>
              </motion.form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 2px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 rounded-3xl bg-gradient-to-r from-[#DC2626] to-[#10B981] p-8 text-center"
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
                onClick={(e) => handleAnchorClick(e, '#contact')}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-[#DC2626] transition hover:scale-105 hover:shadow-xl"
              >
                📅 Réserver maintenant
              </a>
              <a
                href="https://wa.me/+261342141031"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white hover:text-[#DC2626]"
              >
                💬 WhatsApp
              </a>
            </div>
          </motion.div>

          {/* Main Footer Content */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Ny Tranonay Logo"
                  className="h-12 w-12 rounded-full object-cover shadow-lg"
                />
                <h3 className="text-xl font-bold text-white">Ny Tranonay</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                L'espace loisir incontournable à Ambohimasina. Location de salle, activités immersives et moments inoubliables à Madagascar.
              </p>
              
              {/* Social Links */}
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">Suivez-nous</p>
                <div className="flex gap-3">
                  <motion.a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#DC2626]"
                  >
                    <span className="sr-only">Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </motion.a>
                  <motion.a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#DC2626]"
                  >
                    <span className="sr-only">Instagram</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </motion.a>
                  <motion.a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#DC2626]"
                  >
                    <span className="sr-only">TikTok</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.5a4.83 4.83 0 01-1.04-.1z" />
                    </svg>
                  </motion.a>
                </div>
              </div>
            </div>

            {/* Navigation Column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Navigation</h4>
              <ul className="space-y-3 text-sm">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="group inline-flex items-center text-white/70 transition hover:text-white"
                      onClick={(e) => handleAnchorClick(e, link.href)}
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
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Contact</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-base">📍</span>
                  <div>
                    <div className="font-medium text-white">Adresse</div>
                    <div>Ambohimasina, Votovorona</div>
                    <div>CUR, Madagascar</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base">📞</span>
                  <div>
                    <div className="font-medium text-white">Téléphone</div>
                    <a href="tel:+261342141031" className="hover:text-white transition">
                      +261 34 21 410 31
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base">✉️</span>
                  <div>
                    <div className="font-medium text-white">Email</div>
                    <a href="mailto:contact@nytranonay.mg" className="hover:text-white transition">
                      contact@nytranonay.mg
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Hours Column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Horaires</h4>
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
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#10B981]"></span>
                  <span className="text-white/90">Actuellement ouvert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
              <p className="text-xs text-white/50">
                © 2026 Ny Tranonay - Espace Loisir Ambohimasina. Tous droits réservés.
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Suspense fallback={null}>
            <GalleryLightbox
              image={lightbox}
              onClose={() => setLightbox(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/+261340232350"
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float"
        aria-label="Contactez-nous sur WhatsApp"
      >
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.004 2C6.496 2 2.043 6.455 2.043 12c0 2.063.648 4.012 1.758 5.648l-1.16 4.242 4.336-1.136A9.95 9.95 0 0012.004 22c5.508 0 9.957-4.456 9.957-10 0-5.544-4.449-10-9.957-10zM7.91 7.73c.276 0 .553.004.797.008.269.004.56-.004.822.636.267.653.866 2.297.944 2.465.078.168.13.363.026.586-.104.223-.156.363-.312.553-.156.19-.328.423-.44.566-.117.147-.238.307-.102.602.136.295.604.996 1.295 1.613.89.794 1.64 1.04 1.873 1.157.233.117.37.097.506-.058.136-.155.582-.679.738-.912.156-.233.312-.194.526-.117.214.078 1.357.64 1.59.756.233.117.388.175.446.27.058.096.058.556-.136 1.091-.194.536-.776 1.008-1.064 1.05-.276.039-.598.056-1.95-.416-1.446-.505-2.485-1.822-2.56-1.906-.074-.084-1.008-1.338-1.008-2.553 0-1.215.639-1.815.864-2.063.225-.248.49-.29.654-.29z" />
        </svg>
      </a>
    </div>
  )
}

export default App