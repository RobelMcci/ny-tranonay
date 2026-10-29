import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchBuildVersion, fetchDraft, fetchHistory, fetchPublished, publishContent, rebuildSite, restoreSnapshot } from '../api.js'
import { deriveBuildStatus, describeBuildStatus, formatSnapshotDate, startPolling } from '../build-status.js'
import ConfirmRestore from '../components/ConfirmRestore.jsx'
import Field from '../components/Field.jsx'
import { diffContent, groupChanges } from '../diff.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'
const MAX_LABEL = 60

const KIND = {
  added: { text: 'Ajouté', className: 'bg-emerald-50 text-emerald-900 ring-emerald-300' },
  removed: { text: 'Supprimé', className: 'bg-red-50 text-red-900 ring-red-300' },
  changed: { text: 'Modifié', className: 'bg-amber-50 text-amber-950 ring-amber-300' },
}

const BUILD_STYLE = {
  online: 'bg-emerald-50 text-emerald-950 ring-emerald-200',
  building: 'bg-amber-50 text-amber-950 ring-amber-300',
  stalled: 'bg-red-50 text-red-900 ring-red-200',
}

function Badge({ className, children }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${className}`}>{children}</span>
}

function Value({ children }) {
  return children === '' ? <em className="text-slate-600">(vide)</em> : <>{children}</>
}

function ChangeLine({ change }) {
  const kind = KIND[change.kind] ?? KIND.changed
  const hasBefore = change.before !== undefined
  const hasAfter = change.after !== undefined
  return (
    <li className="py-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Badge className={kind.className}>{kind.text}</Badge>
        <span className="min-w-0 break-words font-semibold text-[#2B211B]">{change.label}</span>
      </p>
      {(hasBefore || hasAfter) && (
        <p className="mt-1 break-words text-sm text-slate-800">
          {hasBefore && (
            <>
              <span className="sr-only">Avant : </span>
              <span className={hasAfter ? 'text-slate-600' : ''}>
                <Value>{change.before}</Value>
              </span>
            </>
          )}
          {hasBefore && hasAfter && (
            <>
              <span aria-hidden="true"> → </span>
              <span className="sr-only"> ; après : </span>
            </>
          )}
          {hasAfter && (
            <span className="font-medium">
              <Value>{change.after}</Value>
            </span>
          )}
        </p>
      )}
    </li>
  )
}

function Changes({ changes, hasPublished }) {
  const groups = groupChanges(changes)
  return (
    <section aria-labelledby="titre-changements" className="mt-8">
      <h2 id="titre-changements" className="text-xl">
        Ce qui va changer
      </h2>
      {!hasPublished && <p className="mt-2 text-slate-800">Aucune version publiée pour l’instant : tout le contenu sera publié.</p>}
      {changes.length === 0 ? (
        <p className="card-surface mt-4 font-semibold text-slate-800">Aucune modification à publier.</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {groups.map((group) => (
            <section key={group.section} aria-labelledby={`changements-${group.section}`} className="card-surface">
              <h3 id={`changements-${group.section}`} className="text-lg">
                {group.title}{' '}
                <span className="text-sm font-normal text-slate-700">
                  ({group.changes.length} modification{group.changes.length > 1 ? 's' : ''})
                </span>
              </h3>
              <ul className="mt-2 divide-y divide-slate-200">
                {group.changes.map((change, index) => (
                  <ChangeLine key={`${change.label}-${index}`} change={change} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error' } | { status: 'ready' }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [draft, setDraft] = useState(null)
  const [published, setPublished] = useState(null)
  const [history, setHistory] = useState([])
  const [liveVersion, setLiveVersion] = useState(null)
  const [now, setNow] = useState(() => new Date())
  // Date de la dernière relance manuelle de la construction (cette session) : repart à zéro le délai de 10 minutes.
  const [rebuiltAt, setRebuiltAt] = useState(null)

  const [label, setLabel] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [problem, setProblem] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [restoringId, setRestoringId] = useState(null)
  const inFlight = useRef(false)
  const noticeRef = useRef(null)
  const problemRef = useRef(null)

  const loadAll = useCallback(() => Promise.all([fetchDraft(), fetchPublished(), fetchHistory(), fetchBuildVersion()]), [])
  const apply = ([nextDraft, nextPublished, nextHistory, version]) => {
    setDraft(nextDraft)
    setPublished(nextPublished)
    setHistory(nextHistory)
    setLiveVersion(version)
    setNow(new Date())
  }

  useEffect(() => {
    let cancelled = false
    loadAll()
      .then((data) => {
        if (cancelled) return
        apply(data)
        setLoad({ status: 'ready' })
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt, loadAll])

  const retry = () => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  const changes = load.status === 'ready' ? diffContent(published?.payload ?? null, draft) : []
  const latest = history[0] ?? published
  const status = deriveBuildStatus({
    latest: latest ? { id: latest.id, created_at: latest.created_at } : null,
    liveVersion,
    now,
    buildStartedAt: rebuiltAt,
  })
  const waiting = load.status === 'ready' && (status.state === 'building' || status.state === 'stalled')

  // Le suivi s'arrête dès que la version en ligne est la dernière ; il se relance tout seul après un rechargement.
  // Une seule vérification à la fois, en pause quand l'onglet est masqué (voir `startPolling`).
  useEffect(() => {
    if (!waiting) return
    return startPolling(async (isActive) => {
      const version = await fetchBuildVersion()
      if (!isActive()) return
      setLiveVersion(version)
      setNow(new Date())
    })
  }, [waiting])

  // Après un enregistrement de version (ou une réponse incertaine) : on relit tout. Un échec de cette relecture n'annule rien.
  // `quiet` : l'erreur déjà affichée reste le message principal.
  const refreshAfterSave = async ({ quiet = false } = {}) => {
    try {
      apply(await loadAll())
    } catch {
      if (!quiet) setProblem({ message: 'La version est enregistrée, mais l’écran n’a pas pu être actualisé : rechargez la page.' })
    }
  }

  const announce = (message) => {
    setNotice(message)
    setTimeout(() => noticeRef.current?.focus(), 0)
  }

  const onPublish = async (event) => {
    event.preventDefault()
    if (inFlight.current || changes.length === 0) return
    inFlight.current = true
    setSending(true)
    setProblem(null)
    setNotice('')
    try {
      await publishContent(label)
      setLabel('')
      announce('Version enregistrée, construction du site lancée.')
      await refreshAfterSave()
    } catch (error) {
      setProblem({ message: error.message, canRebuild: error.code === 'build_hook_failed' })
      if (error.snapshotId) setLabel('')
      // Sauf refus net, la version a pu être enregistrée alors que la réponse s'est perdue : l'écran doit refléter la réalité.
      if (!error.rejected) await refreshAfterSave({ quiet: true })
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  const onRestore = async (item) => {
    if (inFlight.current) return
    inFlight.current = true
    setRestoringId(item.id)
    setProblem(null)
    setNotice('')
    try {
      await restoreSnapshot(item.id)
      setConfirming(null)
      announce('Retour enregistré : une nouvelle version a été créée, construction du site lancée.')
      await refreshAfterSave()
    } catch (error) {
      setProblem({ message: error.message, canRebuild: error.code === 'build_hook_failed' })
      if (!error.rejected) {
        setConfirming(null)
        await refreshAfterSave({ quiet: true })
      }
    } finally {
      inFlight.current = false
      setRestoringId(null)
    }
  }

  const onRebuild = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setSending(true)
    setProblem(null)
    setNotice('')
    try {
      await rebuildSite()
      setRebuiltAt(new Date().toISOString())
      setNow(new Date())
      announce('Construction du site relancée.')
    } catch (error) {
      setProblem({ message: error.message, canRebuild: error.code === 'build_hook_failed' })
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  // Un message d'erreur peut apparaître loin de l'action (le bouton est en bas de page) : on y amène la vue et le focus.
  useEffect(() => {
    if (problem) problemRef.current?.focus()
  }, [problem])

  const busy = sending || restoringId !== null

  return (
    <section aria-labelledby="titre-publier">
      <h1 id="titre-publier" className="text-2xl sm:text-3xl">
        Publier
      </h1>
      <p className="mt-2 text-slate-700">Vérifiez ce qui va changer, puis mettez le site à jour. Le site actuel reste en ligne jusqu’à la fin de la construction.</p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement des modifications…
        </p>
      )}
      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger les modifications à publier.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && (
        <>
          {/* Zone annoncée aux lecteurs d'écran : l'état de la construction y est toujours présent. */}
          <div role="status" className="mt-6">
            {status.state !== 'none' && (
              <div className={`rounded-2xl p-5 ring-1 ${BUILD_STYLE[status.state]}`}>
                <p className="text-lg font-semibold">
                  <span className="sr-only">État du site : </span>
                  {describeBuildStatus(status)}
                </p>
                {status.since && <p className="mt-1 text-sm">Dernière version enregistrée le {formatSnapshotDate(status.since)}.</p>}
              </div>
            )}
          </div>
          {status.state === 'stalled' && (
            <button type="button" onClick={onRebuild} disabled={busy} className={`btn-primary touch-target mt-4 ${focusRing}`}>
              Relancer la construction
            </button>
          )}

          <div ref={noticeRef} tabIndex={-1} className={`outline-none ${notice ? 'mt-4' : ''}`}>
            {notice && <p className="rounded-2xl bg-emerald-50 p-4 font-semibold text-emerald-950 ring-1 ring-emerald-200">{notice}</p>}
          </div>
          {problem && (
            <div ref={problemRef} tabIndex={-1} role="alert" className="mt-4 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200 outline-none">
              <p className="font-semibold">{problem.message}</p>
              {problem.canRebuild && (
                <button type="button" onClick={onRebuild} disabled={busy} className={`btn-primary touch-target mt-4 ${focusRing}`}>
                  Relancer la construction
                </button>
              )}
            </div>
          )}

          <Changes changes={changes} hasPublished={Boolean(published)} />

          <form onSubmit={onPublish} className="card-surface mt-6 grid gap-4" aria-labelledby="titre-envoi">
            <h2 id="titre-envoi" className="text-xl">
              Mettre le site à jour
            </h2>
            <Field id="publier-etiquette" label="Étiquette de cette version" hint={`Facultatif : un nom court pour retrouver cette version dans l’historique. ${label.length}/${MAX_LABEL} caractères.`}>
              <input
                type="text"
                autoComplete="off"
                maxLength={MAX_LABEL}
                className="input-field"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                disabled={sending}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={changes.length === 0 || busy} className={`btn-primary touch-target ${focusRing}`}>
                {sending ? 'Publication en cours…' : 'Publier'}
              </button>
              {changes.length === 0 && <p className="text-sm text-slate-700">Aucune modification à publier.</p>}
            </div>
          </form>

          <section aria-labelledby="titre-historique" className="mt-10">
            <h2 id="titre-historique" className="text-xl">
              Historique
            </h2>
            {history.length > 0 && (
              <p className="mt-2 text-slate-700">{history.length > 1 ? `Les ${history.length} dernières versions` : 'La dernière version'}, de la plus récente à la plus ancienne.</p>
            )}
            {history.length === 0 ? (
              <p className="card-surface mt-4 text-slate-700">Aucune version enregistrée pour l’instant.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {history.map((item, index) => {
                  const date = formatSnapshotDate(item.created_at)
                  const isLatest = index === 0
                  return (
                    <li key={item.id} className="card-surface grid gap-3 !p-5">
                      <div>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-[#2B211B]">{date || 'Date inconnue'}</span>
                          {isLatest && <Badge className="bg-slate-100 text-slate-900 ring-slate-400">Version actuelle</Badge>}
                          {item.id === liveVersion && <Badge className="bg-emerald-50 text-emerald-900 ring-emerald-300">En ligne</Badge>}
                        </p>
                        <p className={`mt-1 break-words text-sm ${item.label ? 'text-slate-800' : 'text-slate-600'}`}>{item.label || 'Sans étiquette'}</p>
                      </div>
                      {!isLatest && (
                        <div>
                          <ConfirmRestore
                            label={date || 'date inconnue'}
                            confirming={confirming === item.id}
                            busy={busy}
                            onAsk={() => setConfirming(item.id)}
                            onCancel={() => setConfirming(null)}
                            onConfirm={() => onRestore(item)}
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  )
}
