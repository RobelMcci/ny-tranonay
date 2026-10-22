import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { heroImages, stats, revealVariant, staggerContainer } from '../../data/content'
import { scrollToSection } from '../../utils/scrollTo'

function Hero() {
  const heroRef = useRef(null)
  const [activeImage, setActiveImage] = useState(0)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || heroImages.length < 2) return

    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

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
        color: { value: '#FDF6EC' },
        links: { enable: false },
        move: {
          enable: true,
          speed: 0.3,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'bounce' },
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
        shape: { type: 'circle' },
        size: {
          value: { min: 1, max: 3 },
          random: true,
        },
      },
      detectRetina: true,
    }),
    [],
  )

  return (
    <section
      id="hero"
      ref={heroRef}
      className="hero-section relative overflow-hidden content-visibility-auto"
    >
      {/* Crossfade de photos réelles */}
      {heroImages.map((src, index) => (
        <motion.div
          key={src}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${src}')`,
            scale: heroScale,
          }}
          animate={{ opacity: index === activeImage ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      ))}

      {/* Gradient Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#C2410C]/90 to-[#047857]/90"
        style={{ opacity: heroOpacity }}
      />

      {/* Particles */}
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />

      {/* Hero Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-32">
        <motion.div className="max-w-3xl" initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={revealVariant} className="mb-4">
            <span className="pill bg-white/90 text-[#C2410C]">
              🇲🇬 Ambohimasina, Votovorona, CUR
            </span>
          </motion.div>

          <motion.h1
            variants={revealVariant}
            className="text-4xl text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            L&apos;espace loisir{' '}
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              immersif
            </span>
          </motion.h1>

          <motion.p variants={revealVariant} className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
            Piscine, baby-foot, karaoké, grillades et jardin zen : tout est réuni pour une
            expérience inoubliable à Madagascar.
          </motion.p>

          <motion.div variants={revealVariant} className="mt-8 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="btn-primary relative overflow-hidden"
              onClick={(e) => scrollToSection(e, '#contact')}
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
              className="btn-outline border-white text-white hover:bg-white hover:text-[#2B211B]"
              onClick={(e) => scrollToSection(e, '#activities')}
            >
              Découvrir les activités
            </a>
          </motion.div>

          <motion.div variants={revealVariant} className="mt-8 flex flex-wrap gap-3">
            <span className="pill">Événements sur-mesure</span>
            <span className="pill">Team building & EVG/EVJF</span>
            <span className="pill">Ambiance nature & calme</span>
          </motion.div>

          {/* Stats */}
          <motion.div variants={revealVariant} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
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
  )
}

export default Hero
