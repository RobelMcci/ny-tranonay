import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteListItem, loadListItems, saveListItem, saveListOrder } from '../api.js'
import ConfirmRemove from '../components/ConfirmRemove.jsx'
import OrderableList from '../components/OrderableList.jsx'
import { LIST_KEYS, LIST_LABELS } from '../list-keys.js'
import { withPositions } from '../reorder.js'
import { useUnsavedWarning } from '../useUnsavedWarning.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'
const MAX_LABEL = 120

/** @returns {string | null} Message d'erreur, ou `null` si le texte est valide. */
function validateLabel(text) {
  const label = text.trim()
  if (label === '') return 'Le texte est obligatoire.'
  if (label.length > MAX_LABEL) return `Le texte ne peut pas dépasser ${MAX_LABEL} caractères.`
  return null
}

const byPosition = (a, b) => a.position - b.position || a.id - b.id

function ListItem({ row, index, listLabel, draft, error, busy, confirming, onDraft, onCommit, onRevert, onToggleVisible, onAskRemove, onCancelRemove, onRemove }) {
  const text = draft ?? row.label
  const changed = draft !== undefined && draft !== row.label
  const inputId = `liste-element-${row.id}`
  const errorId = `${inputId}-erreur`
  return (
    <div className="grid gap-3">
      <div>
        <label htmlFor={inputId} className="field-label">
          Texte de l’élément {index + 1} de la liste « {listLabel} »
        </label>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          disabled={busy}
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              if (changed) onCommit()
            } else if (event.key === 'Escape' && changed) {
              onRevert()
            }
          }}
          className="input-field"
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm font-semibold text-red-800">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {changed && (
          <>
            <button type="button" onClick={onCommit} disabled={busy} className={`btn-primary touch-target ${focusRing}`}>
              Enregistrer<span className="sr-only"> le texte « {text.trim() || row.label} »</span>
            </button>
            <button type="button" onClick={onRevert} disabled={busy} className={`touch-target rounded-full px-3 text-sm font-semibold underline underline-offset-2 ${focusRing}`}>
              Annuler<span className="sr-only"> la modification de « {row.label} »</span>
            </button>
          </>
        )}
        <label className="touch-target flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#2B211B]">
          <input type="checkbox" role="switch" disabled={busy} checked={row.visible} onChange={onToggleVisible} className="h-6 w-11 shrink-0 accent-[#C2410C]" />
          <span>
            Visible sur le site<span className="sr-only"> : « {row.label} »</span>
          </span>
        </label>
        <ConfirmRemove label={row.label} from="de la liste" confirming={confirming} busy={busy} onAsk={onAskRemove} onCancel={onCancelRemove} onConfirm={onRemove} />
      </div>
    </div>
  )
}

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error' } | { status: 'ready' }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [rows, setRows] = useState([])
  const [drafts, setDrafts] = useState({})
  const [itemErrors, setItemErrors] = useState({})
  const [newTexts, setNewTexts] = useState({})
  const [newErrors, setNewErrors] = useState({})
  const [listErrors, setListErrors] = useState({})
  const [busy, setBusy] = useState({})
  const [adding, setAdding] = useState({})
  const [confirming, setConfirming] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [focusTick, setFocusTick] = useState(0)

  const focusTarget = useRef(null)
  const confirmedOrder = useRef({})
  const orderQueue = useRef(Promise.resolve())
  const orderToken = useRef({})

  useEffect(() => {
    let cancelled = false
    loadListItems()
      .then((items) => {
        if (cancelled) return
        const sorted = [...items].sort(byPosition)
        confirmedOrder.current = Object.fromEntries(LIST_KEYS.map((key) => [key, sorted.filter((row) => row.list_key === key).map((row) => row.id)]))
        setRows(sorted)
        setLoad({ status: 'ready' })
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Le focus est déplacé une fois l'écran à jour (erreur affichée, élément retiré…).
  useEffect(() => {
    if (focusTick === 0 || !focusTarget.current) return
    const target = document.getElementById(focusTarget.current)
    focusTarget.current = null
    target?.focus()
  }, [focusTick])

  const focusAfterRender = (id) => {
    focusTarget.current = id
    setFocusTick((n) => n + 1)
  }

  const retry = useCallback(() => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  const dirty = load.status === 'ready' && rows.some((row) => drafts[row.id] !== undefined && drafts[row.id] !== row.label)
  // Dialogue « Quitter sans enregistrer ? » (navigation interne) + confirmation du navigateur (onglet).
  const leaveDialog = useUnsavedWarning(dirty)

  const itemsOf = (key) => rows.filter((row) => row.list_key === key).sort(byPosition)
  const setBusyFor = (id, value) => setBusy((b) => ({ ...b, [id]: value }))
  const setListError = (key, message) => setListErrors((e) => ({ ...e, [key]: message }))
  const replaceRow = (stored) => setRows((list) => list.map((row) => (row.id === stored.id ? stored : row)))
  const clearDraft = (id) =>
    setDrafts((d) => {
      const { [id]: removed, ...rest } = d
      void removed
      return rest
    })

  const commitLabel = async (row) => {
    const text = drafts[row.id] ?? row.label
    const problem = validateLabel(text)
    if (problem) {
      setItemErrors((e) => ({ ...e, [row.id]: problem }))
      focusAfterRender(`liste-element-${row.id}`)
      return
    }
    setItemErrors((e) => ({ ...e, [row.id]: undefined }))
    setListError(row.list_key, null)
    setBusyFor(row.id, true)
    try {
      const stored = await saveListItem({ ...row, label: text.trim() })
      replaceRow(stored)
      clearDraft(row.id)
      setAnnouncement(`Texte enregistré : « ${stored.label} ».`)
    } catch (error) {
      setListError(row.list_key, error.message)
    } finally {
      setBusyFor(row.id, false)
    }
  }

  const toggleVisible = async (row) => {
    setListError(row.list_key, null)
    setBusyFor(row.id, true)
    try {
      const stored = await saveListItem({ ...row, visible: !row.visible })
      replaceRow(stored)
      setAnnouncement(`« ${stored.label} » ${stored.visible ? 'est maintenant visible' : 'est maintenant masqué'} sur le site.`)
    } catch (error) {
      setListError(row.list_key, error.message)
    } finally {
      setBusyFor(row.id, false)
    }
  }

  // Étape de confirmation (focus, annonce et garde anti-double clic : voir `ConfirmRemove`).
  const removeRow = async (row) => {
    setListError(row.list_key, null)
    setBusyFor(row.id, true)
    try {
      await deleteListItem(row.id)
      setRows((list) => list.filter((candidate) => candidate.id !== row.id))
      clearDraft(row.id)
      confirmedOrder.current[row.list_key] = (confirmedOrder.current[row.list_key] ?? []).filter((id) => id !== row.id)
      setConfirming(null)
      setAnnouncement(`« ${row.label} » retiré de la liste « ${LIST_LABELS[row.list_key]} ».`)
      focusAfterRender(`liste-ajout-${row.list_key}`)
    } catch (error) {
      setListError(row.list_key, error.message)
    } finally {
      setBusyFor(row.id, false)
    }
  }

  const addItem = async (key) => {
    const text = newTexts[key] ?? ''
    const problem = validateLabel(text)
    if (problem) {
      setNewErrors((e) => ({ ...e, [key]: problem }))
      focusAfterRender(`liste-ajout-${key}`)
      return
    }
    setNewErrors((e) => ({ ...e, [key]: undefined }))
    setListError(key, null)
    setAdding((a) => ({ ...a, [key]: true }))
    const current = itemsOf(key)
    const position = current.length > 0 ? Math.max(...current.map((row) => row.position)) + 1 : 0
    try {
      const stored = await saveListItem({ list_key: key, label: text.trim(), position, visible: true })
      setRows((list) => [...list, stored])
      confirmedOrder.current[key] = [...(confirmedOrder.current[key] ?? []), stored.id]
      setNewTexts((t) => ({ ...t, [key]: '' }))
      setAnnouncement(`« ${stored.label} » ajouté à la liste « ${LIST_LABELS[key]} ».`)
      focusAfterRender(`liste-ajout-${key}`)
    } catch (error) {
      setListError(key, error.message)
    } finally {
      setAdding((a) => ({ ...a, [key]: false }))
    }
  }

  // Réordonner : affichage immédiat, enregistrement en file (une seule instruction SQL atomique par déplacement).
  // En cas d'échec rien n'a été écrit : on réaffiche l'ordre de la base (ou, à défaut, le dernier ordre confirmé).
  const reorder = (key, next) => {
    const ordered = withPositions(next)
    const ids = ordered.map((row) => row.id)
    setRows((list) => [...list.filter((row) => row.list_key !== key), ...ordered])
    orderToken.current[key] = (orderToken.current[key] ?? 0) + 1
    const token = orderToken.current[key]
    setListError(key, null)
    orderQueue.current = orderQueue.current.then(async () => {
      try {
        await saveListOrder(ids)
        confirmedOrder.current[key] = ids
      } catch (error) {
        if (token !== orderToken.current[key]) return
        let stored = null
        try {
          stored = new Map((await loadListItems()).filter((row) => row.list_key === key).sort(byPosition).map((row, index) => [row.id, index]))
        } catch {
          stored = null
        }
        const rank = stored ?? new Map((confirmedOrder.current[key] ?? []).map((id, index) => [id, index]))
        setRows((list) => {
          const rolled = withPositions(list.filter((row) => row.list_key === key).sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)))
          confirmedOrder.current[key] = rolled.map((row) => row.id)
          return [...list.filter((row) => row.list_key !== key), ...rolled]
        })
        setListError(key, `${error.message} ${stored ? 'L’ordre enregistré est affiché.' : 'L’ordre précédent est conservé : rechargez la page pour vérifier.'}`)
      }
    })
  }

  return (
    <section aria-labelledby="titre-listes" className="pb-16">
      {leaveDialog}
      <h1 id="titre-listes" className="text-2xl sm:text-3xl">
        Listes
      </h1>
      <p className="mt-2 text-slate-700">
        Les listes affichées sur le site (ce qui est inclus, les extras, les activités…). Ici, chaque modification est enregistrée tout de suite dans le brouillon ; elle n’est visible sur le site qu’après publication.
      </p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement des listes…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger les listes.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && (
        <div className="mt-6 grid gap-6">
          {LIST_KEYS.map((key) => {
            const items = itemsOf(key)
            const headingId = `liste-titre-${key}`
            const addId = `liste-ajout-${key}`
            const addErrorId = `${addId}-erreur`
            return (
              <section key={key} aria-labelledby={headingId} className="card-surface">
                <h2 id={headingId} className="text-xl">
                  {LIST_LABELS[key]}
                </h2>
                {key === 'pack_couple' && <p className="mt-1 text-sm text-slate-700">Ce que comprend le pack couple.</p>}

                <div role="alert">{listErrors[key] && <p className="mt-3 text-sm font-semibold text-red-800">{listErrors[key]}</p>}</div>

                <div className="mt-4">
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-700">Cette liste est vide.</p>
                  ) : (
                    <OrderableList
                      label={LIST_LABELS[key]}
                      items={items}
                      onReorder={(next) => reorder(key, next)}
                      getLabel={(row) => row.label}
                      renderItem={(row, { index }) => (
                        <ListItem
                          row={row}
                          index={index}
                          listLabel={LIST_LABELS[key]}
                          draft={drafts[row.id]}
                          error={itemErrors[row.id]}
                          busy={Boolean(busy[row.id])}
                          confirming={confirming === row.id}
                          onDraft={(value) => {
                            setDrafts((d) => ({ ...d, [row.id]: value }))
                            setItemErrors((e) => ({ ...e, [row.id]: undefined }))
                          }}
                          onCommit={() => commitLabel(row)}
                          onRevert={() => {
                            clearDraft(row.id)
                            setItemErrors((e) => ({ ...e, [row.id]: undefined }))
                          }}
                          onToggleVisible={() => toggleVisible(row)}
                          onAskRemove={() => setConfirming(row.id)}
                          onCancelRemove={() => setConfirming(null)}
                          onRemove={() => removeRow(row)}
                        />
                      )}
                    />
                  )}
                </div>

                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!adding[key]) addItem(key)
                  }}
                  className="mt-5 flex flex-wrap items-start gap-3"
                >
                  <div className="min-w-0 flex-1 basis-60">
                    <label htmlFor={addId} className="field-label">
                      Nouvel élément pour la liste « {LIST_LABELS[key]} »
                    </label>
                    <input
                      id={addId}
                      type="text"
                      autoComplete="off"
                      disabled={Boolean(adding[key])}
                      value={newTexts[key] ?? ''}
                      aria-invalid={newErrors[key] ? true : undefined}
                      aria-describedby={newErrors[key] ? addErrorId : undefined}
                      onChange={(event) => {
                        setNewTexts((t) => ({ ...t, [key]: event.target.value }))
                        setNewErrors((e) => ({ ...e, [key]: undefined }))
                      }}
                      className="input-field"
                    />
                    {newErrors[key] && (
                      <p id={addErrorId} className="mt-1.5 text-sm font-semibold text-red-800">
                        {newErrors[key]}
                      </p>
                    )}
                  </div>
                  <button type="submit" disabled={Boolean(adding[key])} className={`btn-primary touch-target mt-7 ${focusRing}`}>
                    Ajouter<span className="sr-only"> à la liste « {LIST_LABELS[key]} »</span>
                  </button>
                </form>
              </section>
            )
          })}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  )
}
