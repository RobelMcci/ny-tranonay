import { useEffect, useMemo, useState, useRef, lazy, Suspense } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import maison from "./assets/image15.jpg";
import evenement3 from "./assets/image1.jpg";
import babyfoot from "./assets/image2.jpg";
import evenement1 from "./assets/image3.jpg";
import evenement2 from "./assets/image4.jpg";
import grillades from "./assets/image5.jpg";
import nourriture1 from "./assets/image6.jpg";
import nourriture2 from "./assets/image7.jpg";
import nourriture3 from "./assets/image8.jpg";
import nourriture4 from "./assets/image9.jpg";
import vuejardin from "./assets/image10.jpg";
import jardin2 from "./assets/image11.jpg";
import jeuxvideos from "./assets/image12.jpg";
import karaoke from "./assets/image13.jpg";
import escalier from "./assets/image14.jpg";

const logo = "/icon.svg";

// Lazy loading pour les composants moins critiques
const GalleryLightbox = lazy(() => import("./components/GalleryLightbox"));

const activities = [
  {
    title: "Location de salle pour événements",
    desc: "Espaces modulables avec décoration personnalisée.",
    icon: "🎉",
  },
  {
    title: "Baby-foot",
    desc: "Matches conviviaux et tournois privés.",
    icon: "⚽",
  },
  {
    title: "Piscine",
    desc: "Eau claire, transats et ambiance tropicale.",
    icon: "🏊",
  },
  {
    title: "Jeux de société",
    desc: "Jeux modernes et classiques pour tous.",
    icon: "🎲",
  },
  {
    title: "Karaoké & dancing",
    desc: "Soirées chantantes avec sono premium.",
    icon: "🎤",
  },
  {
    title: "Grillades / Barbecue",
    desc: "Espace grillades équipé.",
    icon: "🔥",
  },
  {
    title: "Jeux vidéo & simulateur",
    desc: "Consoles, jeux PC et simulateur de course au volant.",
    icon: "🎮",
  },
  {
    title: "Water gun",
    desc: "Batailles d'eau conviviales pour petits et grands.",
    icon: "💦",
  },
  { title: "Jardin zen", desc: "Nature calme pour se ressourcer.", icon: "🌿" },
  {
    title: "Cinéma & projection",
    desc: 'Écran TV 80" et son immersif.',
    icon: "🎬",
  },
  { title: "Anniversaires", desc: "Forfaits enfants & adultes.", icon: "🎂" },
  { title: "Soirées à thème", desc: "Quiz games, karaoké nights.", icon: "✨" },
  { title: "Coworking calme", desc: "Espace zen en journée.", icon: "💼" },
  { title: "Photo booth", desc: "Souvenirs instantanés.", icon: "📸" },
];

const gallery = [
  { src: maison, alt: "Vue de la maison", category: "Piscine" },
  { src: vuejardin, alt: "Vue du jardin", category: "Jardin" },
  { src: grillades, alt: "Espace barbecue", category: "Grillades" },
  { src: babyfoot, alt: "Baby-foot", category: "Jeux" },
  { src: karaoke, alt: "Karaoké", category: "Soirée" },
  { src: escalier, alt: "Escalier", category: "Espace" },
  { src: jeuxvideos, alt: "Aire jeux vidéo", category: "Jeux" },
  { src: nourriture1, alt: "Nourriture 1", category: "Nourriture" },
  { src: nourriture2, alt: "Nourriture 2", category: "Nourriture" },
  { src: nourriture3, alt: "Nourriture 3", category: "Nourriture" },
  { src: nourriture4, alt: "Nourriture 4", category: "Nourriture" },
  { src: evenement1, alt: "Événement privé", category: "Événement" },
  { src: evenement2, alt: "Salle événement", category: "Événement" },
  { src: evenement3, alt: "Ambiance soirée", category: "Soirée" },
  { src: jardin2, alt: "Jardin zen", category: "Jardin" },
];

const stats = [
  { label: "Activités & espaces", value: "15+" },
  { label: "De jardin", value: "2000 m²" },
  { label: "Capacité max", value: "120 pers." },
  { label: "Ouvert", value: "7j/7" },
];

const rentalPackages = [
  {
    name: "Tafir Privatisation — Journée",
    price: "200 000 Ar",
    period: "/ journée (8h30 - 18h)",
    includes: [
      "Accès piscine",
      "Grande salle",
      "Karaoké & dancing",
      "Baby-foot",
      "Jeux vidéo sur PC",
      "Simulateur de course au volant",
      "Water gun",
      "Jeux de société",
    ],
  },
  {
    name: "Tafir Privatisation — Nuitée",
    price: "200 000 Ar",
    period: "/ nuitée (18h - 9h)",
    includes: [
      "Accès piscine",
      "Grande salle",
      "Karaoké & dancing",
      "Baby-foot",
      "Jeux vidéo sur PC",
      "Simulateur de course au volant",
      "Water gun",
      "Jeux de société",
    ],
    featured: true,
  },
];

const eventPackage = {
  name: "Réception événementielle",
  price: "150 000 Ar",
  period: "/ jour (8h30 - 18h)",
  capacity: "Jusqu'à 50 personnes",
  includes: [
    "Salle dinatoire",
    "Cuisine équipée",
    "Couvert complet",
    "Nappage de table",
    "Housses de chaise",
    "Décoration fleurs",
    "Sonorisation",
  ],
};

const rooms = [
  {
    name: "Chambre double",
    price: "45 000 Ar",
    features: [
      "Lit 2 places",
      "Toilette extérieure",
      "Climatisée",
      "Eau chaude",
      "Wifi",
      "Terrasse privée",
    ],
  },
  {
    name: "Chambre Twin",
    price: "55 000 Ar",
    features: [
      "Lit 2 places + lit monoplace",
      "Toilette extérieure",
      "Climatisée",
      "Eau chaude",
      "Wifi",
      "Terrasse privée",
      "TV",
    ],
    featured: true,
  },
  {
    name: "Chambre double avec TV",
    price: "50 000 Ar",
    features: [
      "Lit 2 places",
      "Toilette extérieure",
      "Climatisée",
      "Eau chaude",
      "Wifi",
      "Terrasse privée",
      "TV",
    ],
  },
  {
    name: "Chambre double, toilette privée",
    price: "60 000 Ar",
    features: [
      "Lit 2 places",
      "Toilette privée",
      "Climatisée",
      "Eau chaude",
      "Wifi",
      "Terrasse privée",
      "TV",
    ],
  },
];

const dining = {
  items: [
    { name: "Plat du jour", price: "10 000 Ar" },
    {
      name: "Plat complet (entrée + résistance + dessert)",
      price: "20 000 Ar",
    },
  ],
  note: "Vous pouvez apporter votre propre nourriture — les boissons sont servies sur place.",
};

const amenities = [
  "🎬 Cinéma",
  "🔥 Barbecue",
  "🍳 Cuisine équipée + frigo",
  "🔊 Sonorisation JBL",
  '📺 Écran TV 80"',
  "📶 Wifi gratuit",
  "🚗 Parking sécurisé",
];

const faqs = [
  {
    q: "Quels sont les horaires pour les chambres ?",
    a: "Le check-in se fait à partir de 10h et le check-out le lendemain à 10h.",
  },
  {
    q: "Peut-on apporter notre propre nourriture ?",
    a: "Oui, vous pouvez apporter votre nourriture. Les boissons, elles, sont servies sur place. Un service de restauration sur commande est aussi disponible (plat du jour ou plat complet).",
  },
  {
    q: "Quelle est la différence entre la privatisation Tafir et la réception événementielle ?",
    a: "La privatisation Tafir (journée ou nuitée, 200 000 Ar) donne accès à l'ensemble des loisirs : piscine, salle, karaoké, baby-foot, jeux vidéo, simulateur de course, water gun. La réception événementielle (150 000 Ar/jour, jusqu'à 50 personnes) est plutôt un pack traiteur pour un événement formel : salle dinatoire, cuisine équipée, couverts, nappage, déco et sonorisation.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons les espèces et le mobile money.",
  },
  {
    q: "Le wifi et le parking sont-ils inclus ?",
    a: "Oui, le wifi gratuit et un parking sécurisé sont disponibles pour tous nos visiteurs.",
  },
  {
    q: "Quelle est la capacité maximale du site ?",
    a: "L'espace peut accueillir jusqu'à 120 personnes, avec une capacité de 50 personnes pour la formule réception événementielle.",
  },
  {
    q: "Comment réserver et sous quel délai avez-vous une réponse ?",
    a: "Vous pouvez réserver directement par WhatsApp ou par téléphone. Nous répondons sous 24h.",
  },
];

const revealVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [galleryFilter, setGalleryFilter] = useState("Tous");
  const [videoError, setVideoError] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const heroRef = useRef(null);
  const activitiesRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  useEffect(() => {
    // Optimisation du chargement initial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1400);

    // Préchargement des images critiques
    const preloadImages = () => {
      const criticalImages = gallery.slice(0, 3).map((img) => img.src);
      criticalImages.forEach((src) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = src;
        document.head.appendChild(link);
      });
    };
    preloadImages();

    return () => clearTimeout(timer);
  }, []);

  // Repérage de la section active (scroll-spy) + bouton retour en haut
  useEffect(() => {
    const sectionIds = [
      "hero",
      "about",
      "activities",
      "gallery",
      "pricing",
      "faq",
      "contact",
    ];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Smooth scroll pour les ancres
  const handleAnchorClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const particlesInit = useMemo(
    () => async (engine) => {
      await loadSlim(engine);
    },
    [],
  );

  const particlesOptions = useMemo(
    () => ({
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        color: { value: "#FDF6EC" },
        links: { enable: false },
        move: {
          enable: true,
          speed: 0.3,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "bounce" },
        },
        number: {
          value: 16,
          density: { enable: true, area: 800 },
        },
        opacity: {
          value: 0.35,
          random: true,
          animation: { enable: true, speed: 0.6, minimumValue: 0.15 },
        },
        shape: { type: "circle" },
        size: {
          value: { min: 1, max: 3 },
          random: true,
        },
      },
      detectRetina: true,
    }),
    [],
  );

  const navLinks = [
    { label: "À propos", href: "#about" },
    { label: "Activités", href: "#activities" },
    { label: "Galerie", href: "#gallery" },
    { label: "Tarifs", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ];

  const galleryCategories = [
    "Tous",
    ...new Set(gallery.map((img) => img.category)),
  ];

  const filteredGallery = useMemo(
    () =>
      gallery.filter(
        (img) => galleryFilter === "Tous" || img.category === galleryFilter,
      ),
    [galleryFilter],
  );

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
                transition={{ duration: 0.6, ease: "easeOut" }}
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

      {/* Header Sticky */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/30 bg-white/90 backdrop-blur-lg shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:py-4">
          <a
            href="#hero"
            className="flex items-center gap-2 text-lg font-bold text-[#2B211B]"
            onClick={(e) => handleAnchorClick(e, "#hero")}
          >
            <motion.img
              src={logo}
              alt="Tranonay Logo"
              className="h-10 w-10 rounded-full object-cover shadow-md"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <span className="hidden sm:inline">Tranonay</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks
              .filter((link) => link.href !== "#contact")
              .map((link) => {
                const isActive = activeSection === link.href.slice(1);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`nav-link relative text-sm font-medium ${isActive ? "text-[#C2410C]" : ""}`}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                  >
                    {link.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#C2410C] to-[#047857] transition-all duration-300 ${isActive ? "w-full" : "w-0"}`}
                    />
                  </a>
                );
              })}
            <a
              href="#contact"
              className="btn-primary"
              onClick={(e) => handleAnchorClick(e, "#contact")}
            >
              Réserver
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="touch-target relative z-50 flex flex-col items-center justify-center gap-1.5 rounded-lg md:hidden"
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
                    className={`touch-target flex items-center border-b border-slate-100 py-3 text-base font-medium last:border-0 ${
                      activeSection === link.href.slice(1)
                        ? "text-[#C2410C]"
                        : "text-[#2B211B]"
                    }`}
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
                  onClick={(e) => handleAnchorClick(e, "#contact")}
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#C2410C]/90 to-[#047857]/90" />

          {/* Particles */}
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={particlesOptions}
          />

          {/* Hero Content */}
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-32">
            <motion.div
              className="max-w-3xl"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={revealVariant} className="mb-4">
                <span className="pill bg-white/90 text-[#C2410C]">
                  🇲🇬 Ambohimasina, Votovorona, CUR
                </span>
              </motion.div>

              <motion.h1
                variants={revealVariant}
                className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl xl:text-7xl"
              >
                L&apos;espace loisir{" "}
                <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  immersif
                </span>
              </motion.h1>

              <motion.p
                variants={revealVariant}
                className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl"
              >
                Piscine, baby-foot, karaoké, grillades et jardin zen : tout est
                réuni pour une expérience inoubliable à Madagascar.
              </motion.p>

              <motion.div
                variants={revealVariant}
                className="mt-8 flex flex-wrap gap-4"
              >
                <a
                  href="#contact"
                  className="btn-primary relative overflow-hidden"
                  onClick={(e) => handleAnchorClick(e, "#contact")}
                >
                  <span className="relative z-10">Réserver maintenant</span>
                  <motion.div
                    className="absolute inset-0 bg-white"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ opacity: 0.2 }}
                  />
                </a>
                <a
                  href="#activities"
                  className="btn-outline border-white text-white hover:bg-white hover:text-[#2B211B]"
                  onClick={(e) => handleAnchorClick(e, "#activities")}
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
                      transition={{ delay: 0.5, type: "spring" }}
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
        <section
          id="about"
          className="section-min section-pattern bg-brand-cream content-visibility-auto"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2 variants={revealVariant} className="section-title">
                  Un lieu complet pour se détendre et célébrer
                </motion.h2>

                <motion.p variants={revealVariant} className="section-subtitle">
                  Tranonay est un espace de loisir multifonctionnel à
                  Ambohimasina, conçu pour les familles, entreprises et groupes
                  d&apos;amis. Ici, chaque zone est pensée pour la convivialité
                  et la détente.
                </motion.p>

                <motion.div
                  variants={revealVariant}
                  className="mt-8 grid gap-4 sm:grid-cols-2"
                >
                  {[
                    {
                      title: "📍 Localisation stratégique",
                      desc: "À 10 min du CUR, accès rapide et sécurisé.",
                    },
                    {
                      title: "🌿 Ambiance nature",
                      desc: "Jardin luxuriant de 2000m², calme et ressourçant.",
                    },
                    {
                      title: "🤝 Services partenaires",
                      desc: "Traiteur, photographe, location de matériel.",
                    },
                    {
                      title: "📲 Réservations faciles",
                      desc: "Par WhatsApp ou par téléphone, réponse sous 24h.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="card-surface">
                      <h3 className="text-lg font-semibold text-[#2B211B]">
                        {item.title}
                      </h3>
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
                    <h3 className="text-xl font-semibold">
                      Espace loisirs Ambohimasina
                    </h3>
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
        <section
          id="activities"
          ref={activitiesRef}
          className="section-min content-visibility-auto"
        >
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
              <motion.p
                variants={revealVariant}
                className="section-subtitle mx-auto"
              >
                15 expériences uniques pour tous les âges : loisirs, nature,
                événements et détente.
              </motion.p>
            </motion.div>

            <motion.div
              className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {activities.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={revealVariant}
                  custom={index}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg"
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C2410C] to-[#047857] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />

                  <div className="text-4xl">{item.icon}</div>

                  <h3 className="mt-4 text-lg font-semibold text-[#2B211B]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Gallery Section */}
        <section
          id="gallery"
          className="section-min bg-brand-cream content-visibility-auto"
        >
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
              <motion.p
                variants={revealVariant}
                className="section-subtitle mx-auto"
              >
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
                  className={`pill touch-target transition-all ${
                    galleryFilter === cat
                      ? "bg-[#C2410C] text-white"
                      : "bg-white text-[#2B211B] hover:bg-[#C2410C]/10"
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
                  transition={{ type: "spring", stiffness: 300 }}
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
        <section
          id="pricing"
          className="section-min bg-brand-cream content-visibility-auto"
        >
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
              <motion.p
                variants={revealVariant}
                className="section-subtitle mx-auto"
              >
                Des formules claires pour chaque occasion : journée entre amis,
                réception formelle ou nuit sur place.
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
                    plan.featured ? "border-2 border-[#C2410C]" : ""
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
                  <h4 className="text-xl font-bold text-[#2B211B]">
                    {plan.name}
                  </h4>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-[#C2410C]">
                      {plan.price}
                    </span>
                    <span className="ml-2 text-sm text-slate-500">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {plan.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-[#047857]">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className="mt-6 block w-full rounded-xl border-2 border-[#C2410C] py-3 text-center font-semibold text-[#C2410C] transition hover:bg-[#C2410C] hover:text-white"
                    onClick={(e) => handleAnchorClick(e, "#contact")}
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
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
                  {eventPackage.capacity}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold">{eventPackage.price}</span>
                <span className="ml-2 text-sm text-white/80">
                  {eventPackage.period}
                </span>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {eventPackage.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <span>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="mt-6 block w-full rounded-xl bg-white py-3 text-center font-semibold text-[#C2410C] transition hover:bg-white/90"
                onClick={(e) => handleAnchorClick(e, "#contact")}
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
                    room.featured ? "border-2 border-[#C2410C]" : ""
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <h4 className="text-base font-bold text-[#2B211B]">
                    {room.name}
                  </h4>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-[#C2410C]">
                      {room.price}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">/nuit</span>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {room.features.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <span className="mt-0.5 text-[#047857]">✓</span>
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
                <h4 className="text-lg font-semibold text-[#2B211B]">
                  🍽️ Restauration
                </h4>
                <ul className="mt-4 space-y-2">
                  {dining.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{item.name}</span>
                      <span className="font-semibold text-[#C2410C]">
                        {item.price}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500">{dining.note}</p>
              </div>
              <div className="card-surface">
                <h4 className="text-lg font-semibold text-[#2B211B]">
                  ✨ Équipements inclus
                </h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  {amenities.map((item) => (
                    <span key={item} className="pill bg-brand-cream">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section-min content-visibility-auto">
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
              <motion.p
                variants={revealVariant}
                className="section-subtitle mx-auto"
              >
                Les réponses aux questions qu'on nous pose le plus souvent.
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
                const isOpen = openFaq === index;
                return (
                  <motion.div
                    key={item.q}
                    variants={revealVariant}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      className="touch-target flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="font-semibold text-[#2B211B]">
                        {item.q}
                      </span>
                      <span
                        className={`shrink-0 text-xl text-[#C2410C] transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section-min content-visibility-auto">
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
              <motion.p
                variants={revealVariant}
                className="section-subtitle mx-auto"
              >
                Pas de réservation en ligne : contactez-nous directement par
                WhatsApp ou par téléphone, on s'occupe du reste.
              </motion.p>

              <motion.div
                variants={revealVariant}
                className="mx-auto mt-6 flex max-w-md flex-col gap-4 sm:flex-row"
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
                <a className="btn-outline flex-1" href="tel:+261342141031">
                  <span className="mr-2">📞</span>
                  Appeler
                </a>
              </motion.div>

              <motion.div
                variants={revealVariant}
                className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <div className="card-surface">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Capacité
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#2B211B]">
                    Jusqu&apos;à 120 pers. (site)
                  </p>
                </div>
                <div className="card-surface">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Horaires
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#2B211B]">
                    08h - 22h
                  </p>
                </div>
                <div className="card-surface">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Paiement
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#2B211B]">
                    Espèces / Mobile money
                  </p>
                </div>
                <div className="card-surface">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Wifi
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#2B211B]">
                    Gratuit haut débit
                  </p>
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
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20px 20px, white 2px, transparent 2px)",
              backgroundSize: "40px 40px",
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
                onClick={(e) => handleAnchorClick(e, "#contact")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-[#C2410C] transition hover:scale-105 hover:shadow-xl"
              >
                📅 Réserver maintenant
              </a>
              <a
                href="https://wa.me/+261342141031"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white hover:text-[#C2410C]"
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
                  alt="Tranonay Logo"
                  className="h-12 w-12 rounded-full object-cover shadow-lg"
                />
                <h3 className="text-xl font-bold text-white">Tranonay</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                L'espace loisir incontournable à Ambohimasina. Location de
                salle, activités immersives et moments inoubliables à
                Madagascar.
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
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                      onClick={(e) => handleAnchorClick(e, link.href)}
                    >
                      <span className="mr-2 transition group-hover:translate-x-1">
                        →
                      </span>
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
                    <a
                      href="tel:+261342141031"
                      className="hover:text-white transition"
                    >
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
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#047857]"></span>
                  <span className="text-white/90">Actuellement ouvert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
              <p className="text-xs text-white/50">
                © 2026 Tranonay - Espace Loisir Ambohimasina. Tous droits
                réservés.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <a
                  href="#"
                  className="text-white/50 transition hover:text-white"
                >
                  Mentions légales
                </a>
                <span className="text-white/30">•</span>
                <a
                  href="#"
                  className="text-white/50 transition hover:text-white"
                >
                  Politique de confidentialité
                </a>
                <span className="text-white/30">•</span>
                <a
                  href="#"
                  className="text-white/50 transition hover:text-white"
                >
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
        href="https://wa.me/+261342141031"
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float"
        aria-label="Contactez-nous sur WhatsApp"
      >
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.004 2C6.496 2 2.043 6.455 2.043 12c0 2.063.648 4.012 1.758 5.648l-1.16 4.242 4.336-1.136A9.95 9.95 0 0012.004 22c5.508 0 9.957-4.456 9.957-10 0-5.544-4.449-10-9.957-10zM7.91 7.73c.276 0 .553.004.797.008.269.004.56-.004.822.636.267.653.866 2.297.944 2.465.078.168.13.363.026.586-.104.223-.156.363-.312.553-.156.19-.328.423-.44.566-.117.147-.238.307-.102.602.136.295.604.996 1.295 1.613.89.794 1.64 1.04 1.873 1.157.233.117.37.097.506-.058.136-.155.582-.679.738-.912.156-.233.312-.194.526-.117.214.078 1.357.64 1.59.756.233.117.388.175.446.27.058.096.058.556-.136 1.091-.194.536-.776 1.008-1.064 1.05-.276.039-.598.056-1.95-.416-1.446-.505-2.485-1.822-2.56-1.906-.074-.084-1.008-1.338-1.008-2.553 0-1.215.639-1.815.864-2.063.225-.248.49-.29.654-.29z" />
        </svg>
      </a>

      {/* Bouton retour en haut */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="touch-target fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B211B] text-white shadow-soft transition-shadow hover:shadow-xl"
            aria-label="Retour en haut"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
