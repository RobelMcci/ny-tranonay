import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClientOnly, Head } from 'vite-react-ssg'
import { AuthProvider } from './auth.jsx'
import NewPassword from './NewPassword.jsx'
import { useAuth } from './useAuth.js'

const icon = (children) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const SECTIONS = [
  { to: '/admin', label: 'Accueil', end: true, icon: icon(<path d="M4 11 12 4l8 7v9H4v-9Z" />) },
  { to: '/admin/informations', label: 'Informations', icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>) },
  { to: '/admin/tarifs', label: 'Tarifs', icon: icon(<><path d="M3 12 12 3h8v8l-9 9-8-8Z" /><circle cx="15.5" cy="8.5" r="1" /></>) },
  { to: '/admin/chambres', label: 'Chambres', icon: icon(<path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />) },
  { to: '/admin/listes', label: 'Listes', icon: icon(<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />) },
  { to: '/admin/faq', label: 'FAQ', icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></>) },
  { to: '/admin/photos', label: 'Photos', icon: icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" /></>) },
  { to: '/admin/textes', label: 'Textes', icon: icon(<path d="M5 6V4h14v2M12 4v16M9 20h6" />) },
  { to: '/admin/referencement', label: 'Référencement', icon: icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>) },
  { to: '/admin/publier', label: 'Publier', icon: icon(<path d="M12 16V4M7 9l5-5 5 5M4 20h16" />) },
]

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDF6EC] text-slate-700" role="status">
      Chargement…
    </div>
  )
}

function Shell() {
  const { signOut, flash, clearFlash } = useAuth()
  const sidebarLink =
    'touch-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2B211B] transition-colors hover:bg-[#FDF6EC] aria-[current=page]:bg-[#C2410C] aria-[current=page]:text-white'
  const bottomLink =
    'touch-target flex min-w-[4.75rem] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-semibold text-[#2B211B] aria-[current=page]:text-[#C2410C] aria-[current=page]:underline underline-offset-4'

  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      <a
        href="#contenu-admin"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 font-semibold text-[#C2410C] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-black/5 bg-white p-4 md:flex">
        <p className="font-display px-3 py-2 text-xl font-semibold text-[#2B211B]">Tranonay</p>
        <nav aria-label="Sections" className="mt-2 flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <NavLink key={s.to} to={s.to} end={s.end} className={sidebarLink}>
              {s.icon}
              {s.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-black/5 bg-white/95 px-4 py-2 backdrop-blur">
          <p className="font-display text-lg font-semibold text-[#2B211B] md:hidden">Administration</p>
          <p className="hidden text-sm font-semibold text-slate-700 md:block">Administration</p>
          <div className="flex items-center gap-1">
            <Link to="/" className="touch-target flex items-center rounded-xl px-3 text-sm font-semibold text-[#9A3412] underline underline-offset-2">
              Voir le site
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="touch-target rounded-xl px-3 text-sm font-semibold text-[#2B211B] hover:bg-[#FDF6EC]"
            >
              Se déconnecter
            </button>
          </div>
        </header>

        <main id="contenu-admin" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div role="status">
            {flash && (
              <p className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200">
                {flash}
                <button type="button" onClick={clearFlash} className="touch-target px-2 underline underline-offset-2">
                  Fermer
                </button>
              </p>
            )}
          </div>
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {SECTIONS.map((s) => (
          <NavLink key={s.to} to={s.to} end={s.end} className={bottomLink}>
            {s.icon}
            {s.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Garde : non connecté → connexion ; administrateur sur la connexion → accueil. */
function Guard() {
  const { session, isAdmin, loading, recovery } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onLogin = pathname.replace(/\/+$/, '') === '/admin/connexion'
  const allowed = Boolean(session) && isAdmin

  if (loading) return <LoadingShell />
  // Lien « mot de passe oublié » : choisir un nouveau mot de passe avant tout (administrateurs seulement).
  if (recovery && allowed) return <NewPassword onDone={() => navigate('/admin', { replace: true })} />
  if (onLogin) return allowed ? <Navigate to="/admin" replace /> : <Outlet />
  if (!allowed) return <Navigate to="/admin/connexion" replace />
  return <Shell />
}

export function Component() {
  return (
    <>
      <Head>
        <title>Administration | Tranonay</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {/* Pré-rendu : simple coquille « Chargement… », identique au premier rendu client. */}
      <ClientOnly fallback={<LoadingShell />}>
        {() => (
          <AuthProvider>
            <Guard />
          </AuthProvider>
        )}
      </ClientOnly>
    </>
  )
}
