import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDraft, fetchPublished } from '../api.js'
import { diffContent, modificationsLabel } from '../diff.js'

const SHORTCUTS = [
  { to: '/admin/informations', title: 'Informations', text: 'Nom, téléphone, adresse, horaires et sécurité.' },
  { to: '/admin/tarifs', title: 'Tarifs', text: 'Les prix de la salle, de la privatisation et des repas.' },
  { to: '/admin/chambres', title: 'Chambres', text: 'Prix, équipements et photos de chaque chambre.' },
  { to: '/admin/listes', title: 'Listes', text: 'Ce qui est inclus, les extras, les activités et les types d’événement.' },
  { to: '/admin/faq', title: 'FAQ', text: 'Questions fréquentes et leurs réponses.' },
  { to: '/admin/photos', title: 'Photos', text: 'Ajouter des photos et choisir celles qui illustrent le site.' },
  { to: '/admin/textes', title: 'Textes', text: 'Titres et textes d’introduction des pages.' },
  { to: '/admin/referencement', title: 'Référencement', text: 'Titre et description de chaque page pour Google.' },
  { to: '/admin/publier', title: 'Publier', text: 'Vérifier les modifications puis mettre le site à jour.' },
]

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

export function Component() {
  // `state` : { status: 'loading' } | { status: 'error' } | { status: 'ready', changes, hasPublished }
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchDraft(), fetchPublished()])
      .then(([draft, published]) => {
        if (cancelled) return
        const changes = diffContent(published?.payload ?? null, draft)
        setState({ status: 'ready', changes, hasPublished: Boolean(published) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return (
    <section aria-labelledby="titre-accueil">
      <h1 id="titre-accueil" className="text-2xl sm:text-3xl">
        Accueil
      </h1>
      <p className="mt-2 text-slate-700">Choisissez ce que vous voulez modifier. Rien n’est visible sur le site avant d’avoir publié.</p>

      <div role="status" className="mt-6">
        {state.status === 'loading' && (
          <p className="card-surface text-slate-700">Chargement des modifications…</p>
        )}
        {state.status === 'ready' && <Banner changes={state.changes} hasPublished={state.hasPublished} />}
      </div>
      {state.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de vérifier les modifications non publiées.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      <h2 className="mt-10 text-xl">Sections</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {SHORTCUTS.map((s) => (
          <li key={s.to}>
            <Link
              to={s.to}
              className={`card-surface touch-target block h-full transition hover:-translate-y-0.5 hover:ring-[#C2410C]/40 ${focusRing}`}
            >
              <span className="block text-lg font-semibold text-[#2B211B]">{s.title}</span>
              <span className="mt-1 block text-sm text-slate-700">{s.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Banner({ changes, hasPublished }) {
  const count = changes.length
  const pending = count > 0
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ${pending ? 'bg-amber-50 text-amber-950 ring-amber-300' : 'bg-emerald-50 text-emerald-950 ring-emerald-200'}`}
    >
      <p className="text-lg font-semibold">{modificationsLabel(count, hasPublished)}</p>
      {pending ? (
        <Link
          to="/admin/publier"
          className={`btn-primary touch-target mt-4 ${focusRing}`}
        >
          Voir et publier
        </Link>
      ) : (
        hasPublished && <p className="mt-1 text-sm">Le site publié correspond à vos contenus.</p>
      )}
    </div>
  )
}
