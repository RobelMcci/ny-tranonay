import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import frauncesUrl from '@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url'
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { business, pages, whatsappLink } from '../data/site.js'
import Footer from './Footer.jsx'
import ScrollProgress from './ScrollProgress.jsx'
import { MessengerIcon, PhoneIcon, WhatsappIcon, CalendarIcon } from './Icons.jsx'

const navPages = pages.filter((p) => p.nav)

function Header() {
  // Le menu est « ouvert pour » une page précise : il se referme donc seul à chaque navigation.
  const { pathname } = useLocation()
  const [openFor, setOpenFor] = useState(null)
  const open = openFor === pathname
  const setOpen = (value) => setOpenFor(value ? pathname : null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpenFor(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Navigation principale">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Tranonay, retour à l’accueil">
          <img src="/icon.svg" alt="" width="40" height="40" className="h-10 w-10 rounded-full shadow-md" />
          <span className="font-display text-xl font-semibold text-[#2B211B]">Tranonay</span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navPages.map((p) => (
            <NavLink key={p.path} to={p.path} className="nav-link">
              {p.nav}
            </NavLink>
          ))}
          <Link to="/tarifs-devis#simulateur" className="btn-primary !px-5 !py-2.5 text-sm">
            Devis instantané
          </Link>
        </div>

        <button
          type="button"
          className="touch-target flex items-center justify-center rounded-xl text-[#2B211B] lg:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-black/5 bg-white px-4 pb-5 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {navPages.map((p) => (
              <li key={p.path}>
                <NavLink to={p.path} className="block border-b border-slate-100 py-3.5 text-base font-semibold text-[#2B211B] aria-[current=page]:text-[#C2410C]">
                  {p.nav}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/tarifs-devis#simulateur" className="btn-primary mt-4 w-full">
            Devis instantané
          </Link>
        </div>
      )}
    </header>
  )
}

/** Barre d'actions collante sur mobile : joindre Tranonay en un geste. */
function MobileActionBar() {
  const item = 'touch-target flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold'
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      <a href={business.phoneHref} className={`${item} text-[#2B211B]`}>
        <PhoneIcon /> Appeler
      </a>
      <a href={whatsappLink()} target="_blank" rel="noreferrer" className={`${item} text-[#0F7A3F]`}>
        <WhatsappIcon /> WhatsApp
      </a>
      <a href={business.messengerUrl} target="_blank" rel="noreferrer" className={`${item} text-[#0866FF]`}>
        <MessengerIcon /> Messenger
      </a>
      <Link to="/tarifs-devis#simulateur" className={`${item} text-[#C2410C]`}>
        <CalendarIcon /> Devis
      </Link>
    </div>
  )
}

export default function Layout() {
  const { pathname, hash } = useLocation()

  // Remonte en haut à chaque nouvelle page, sauf pour une ancre (#simulateur…).
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {/* Précharge les polices du premier écran : évite l'attente du remplacement de police (LCP). */}
        <Head>
          <link rel="preload" as="font" type="font/woff2" href={interUrl} crossOrigin="anonymous" />
          <link rel="preload" as="font" type="font/woff2" href={frauncesUrl} crossOrigin="anonymous" />
        </Head>
        <a
          href="#contenu"
          className="sr-only z-50 rounded-full bg-white px-4 py-2 font-semibold text-[#C2410C] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Aller au contenu
        </a>
        <ScrollProgress />
        <Header />
        <main id="contenu" key={pathname} className="page-in">
          <Outlet />
        </main>
        <Footer />
        <MobileActionBar />
      </MotionConfig>
    </LazyMotion>
  )
}
