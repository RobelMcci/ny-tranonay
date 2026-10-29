import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteFaq, loadFaqs, saveFaq, saveFaqOrder } from '../api.js'
import ConfirmRemove from '../components/ConfirmRemove.jsx'
import Field from '../components/Field.jsx'
import OrderableList from '../components/OrderableList.jsx'
import SaveBar from '../components/SaveBar.jsx'
import TokenHelp, { VarsNotice } from '../components/TokenHelp.jsx'
import { tokenProblem } from '../draft-vars.js'
import { MAX_ANSWER, MAX_QUESTION, validateFaq } from '../faqs-map.js'
import { withPositions } from '../reorder.js'
import { useDraftVars } from '../useDraftVars.js'
import { useFieldInsert } from '../useFieldInsert.js'
import { useUnsavedWarning } from '../useUnsavedWarning.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

const fr = (n) => n.toLocaleString('fr-FR').replace(/[\u00A0\u202F]/g, ' ')
const fieldId = (entryId, field) => `faq-${entryId}-${field}`
const FIELD_ID = /^faq-(.+)-(question|answer)$/

/**
 * Une question du formulaire : `id` = clé stable de la liste (identifiant enregistré, ou clé provisoire tant qu'elle n'est pas enregistrée),
 * `base` = question enregistrée (`null` si nouvelle), `form` = saisie en cours.
 * @typedef {{ id: number | string, position: number, base: import('../faqs-map.js').Faq | null, form: { question: string, answer: string, visible: boolean } }} Entry
 */

const toEntry = (faq) => ({ id: faq.id, position: faq.position, base: faq, form: { question: faq.question, answer: faq.answer, visible: faq.visible } })

const toEntryFromBase = (entry) => ({ ...entry, form: { question: entry.base.question, answer: entry.base.answer, visible: entry.base.visible } })

const isDirty = (entry) =>
  !entry.base || entry.form.question !== entry.base.question || entry.form.answer !== entry.base.answer || entry.form.visible !== entry.base.visible

function FaqCard({ entry, index, count, disabled, busy, vars, errors, show, confirming, onChange, onBlur, onToggleVisible, onInsert, onAsk, onCancel, onConfirm }) {
  const questionId = fieldId(entry.id, 'question')
  const answerId = fieldId(entry.id, 'answer')
  const title = entry.form.question.trim() || 'Nouvelle question'
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">
        Question {index + 1} sur {count}
        {!entry.form.visible && ' · Masquée sur le site'}
        {isDirty(entry) && ' · Non enregistrée'}
      </p>
      <fieldset disabled={disabled || busy} aria-label={`Question : ${title}`} className="mt-3 grid min-w-0 gap-4">
        <Field id={questionId} label="Question" hint={`${fr(MAX_QUESTION)} caractères au plus.`} error={show('question') ? errors.question : undefined}>
          <input type="text" autoComplete="off" className="input-field" value={entry.form.question} onChange={onChange('question')} onBlur={onBlur('question')} />
        </Field>
        <Field id={answerId} label="Réponse" hint={`${fr(MAX_ANSWER)} caractères au plus.`} error={show('answer') ? errors.answer : undefined}>
          <textarea rows={5} className="input-field" value={entry.form.answer} onChange={onChange('answer')} onBlur={onBlur('answer')} />
        </Field>
        <TokenHelp vars={vars} onInsert={onInsert} disabled={disabled || busy} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="touch-target flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#2B211B]">
            <input type="checkbox" role="switch" className="h-6 w-11 shrink-0 accent-[#C2410C]" checked={entry.form.visible} onChange={onToggleVisible} />
            <span>
              Visible sur le site<span className="sr-only"> : « {title} »</span>
            </span>
          </label>
          <ConfirmRemove label={title} from="de la FAQ" confirming={confirming} busy={disabled || busy} onAsk={onAsk} onCancel={onCancel} onConfirm={onConfirm} />
        </div>
      </fieldset>
    </div>
  )
}

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error' } | { status: 'ready' }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  /** @type {[Entry[], Function]} */
  const [entries, setEntries] = useState([])
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const [order, setOrder] = useState({ status: 'idle', message: '' })
  const [actionError, setActionError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [focusTick, setFocusTick] = useState(0)

  const { state: varsState, retry: retryVars } = useDraftVars()
  const focusTarget = useRef(null)
  const confirmedOrder = useRef([])
  const orderQueue = useRef(Promise.resolve())
  const orderToken = useRef(0)
  const newCount = useRef(0)

  useEffect(() => {
    let cancelled = false
    loadFaqs()
      .then((faqs) => {
        if (cancelled) return
        const loaded = faqs.map(toEntry)
        confirmedOrder.current = loaded.map((entry) => entry.id)
        setEntries(loaded)
        setLoad({ status: 'ready' })
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Le focus est déplacé une fois les erreurs et les nouveaux éléments affichés.
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

  const dirtyEntries = load.status === 'ready' ? entries.filter(isDirty) : []
  const dirty = dirtyEntries.length > 0
  const hasNew = entries.some((entry) => !entry.base)
  useUnsavedWarning(dirty)

  const errorsOf = (entry) => {
    const errors = validateFaq(entry.form)
    for (const field of ['question', 'answer']) {
      if (errors[field]) continue
      const problem = tokenProblem(varsState, entry.form[field])
      if (problem) errors[field] = problem
    }
    return errors
  }
  const showErrors = (id, field) => attempted || Boolean(touched[`${id}:${field}`])

  const update = (id, change) => {
    setEntries((list) => list.map((entry) => (entry.id === id ? { ...entry, form: { ...entry.form, ...change(entry.form) } } : entry)))
    setSaveError(null)
  }
  const onChange = (id, field) => (event) => {
    const { value } = event.target
    update(id, () => ({ [field]: value }))
  }
  const onBlurField = (id, field) => () => setTouched((t) => ({ ...t, [`${id}:${field}`]: true }))

  const { trackFocus, insert } = useFieldInsert((id, value) => {
    const match = FIELD_ID.exec(id)
    if (!match) return
    setEntries((list) => list.map((entry) => (String(entry.id) === match[1] ? { ...entry, form: { ...entry.form, [match[2]]: value } } : entry)))
    setSaveError(null)
  })

  const addFaq = () => {
    newCount.current += 1
    const id = `__nouvelle-${newCount.current}`
    const position = entries.length > 0 ? Math.max(...entries.map((entry) => entry.position)) + 1 : 0
    setEntries((list) => [...list, { id, position, base: null, form: { question: '', answer: '', visible: true } }])
    setSaveError(null)
    setAnnouncement('Nouvelle question ajoutée à la fin de la liste.')
    focusAfterRender(fieldId(id, 'question'))
  }

  const removeEntry = async (entry) => {
    setActionError(null)
    if (!entry.base) {
      setEntries((list) => list.filter((candidate) => candidate.id !== entry.id))
      setConfirming(null)
      setAnnouncement('Question non enregistrée supprimée.')
      focusAfterRender('faq-ajout')
      return
    }
    setBusyId(entry.id)
    try {
      await deleteFaq(entry.base.id)
      setEntries((list) => list.filter((candidate) => candidate.id !== entry.id))
      confirmedOrder.current = confirmedOrder.current.filter((id) => id !== entry.id)
      setConfirming(null)
      setAnnouncement(`Question « ${entry.base.question} » supprimée.`)
      focusAfterRender('faq-ajout')
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyId(null)
    }
  }

  // Réordonner : affichage immédiat, enregistrement en file (une seule instruction SQL atomique par déplacement).
  // En cas d'échec rien n'a été écrit : on réaffiche l'ordre de la base (ou, à défaut, le dernier ordre confirmé).
  const onReorder = (next) => {
    const ordered = withPositions(next)
    setEntries(ordered)
    const ids = ordered.map((entry) => entry.id)
    orderToken.current += 1
    const token = orderToken.current
    setOrder({ status: 'saving', message: 'Enregistrement de l’ordre…' })
    orderQueue.current = orderQueue.current.then(async () => {
      try {
        await saveFaqOrder(ids)
        confirmedOrder.current = ids
        if (token === orderToken.current) setOrder({ status: 'saved', message: 'Ordre enregistré.' })
      } catch (error) {
        if (token !== orderToken.current) return
        let stored = null
        try {
          stored = new Map((await loadFaqs()).map((faq, index) => [faq.id, index]))
        } catch {
          stored = null
        }
        // Un déplacement plus récent a pu être demandé pendant la relecture : son résultat prime.
        if (token !== orderToken.current) return
        const confirmed = new Map(confirmedOrder.current.map((id, index) => [id, index]))
        const rank = (entry) => (stored ? stored.get(entry.id) : confirmed.get(entry.id)) ?? 0
        setEntries((list) => {
          const sorted = withPositions([...list].sort((a, b) => rank(a) - rank(b)))
          confirmedOrder.current = sorted.map((entry) => entry.id)
          return sorted
        })
        setOrder({ status: 'error', message: `${error.message} ${stored ? 'L’ordre enregistré est affiché.' : 'L’ordre précédent est conservé : rechargez la page pour vérifier.'}` })
      }
    })
  }

  const onSave = async () => {
    setAttempted(true)
    const invalid = dirtyEntries.filter((entry) => Object.keys(errorsOf(entry)).length > 0)
    if (invalid.length > 0) {
      setSaveError(invalid.length === 1 ? 'Enregistrement impossible : 1 question est à corriger.' : `Enregistrement impossible : ${invalid.length} questions sont à corriger.`)
      const first = invalid[0]
      const errors = errorsOf(first)
      focusAfterRender(fieldId(first.id, errors.question ? 'question' : 'answer'))
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      for (const entry of dirtyEntries) {
        const stored = await saveFaq({
          id: entry.base?.id,
          question: entry.form.question.trim(),
          answer: entry.form.answer.trim(),
          position: entry.position,
          visible: entry.form.visible,
        })
        setEntries((list) => list.map((candidate) => (candidate.id === entry.id ? toEntry(stored) : candidate)))
        if (!entry.base) confirmedOrder.current = [...confirmedOrder.current, stored.id]
      }
      setSavedAt(new Date())
      setAttempted(false)
      setTouched({})
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    setEntries((list) => list.filter((entry) => entry.base).map(toEntryFromBase))
    setTouched({})
    setAttempted(false)
    setSaveError(null)
  }

  const renderItem = (entry, { index, count }) => {
    const ids = [fieldId(entry.id, 'answer'), fieldId(entry.id, 'question')]
    return (
      <FaqCard
        entry={entry}
        index={index}
        count={count}
        disabled={saving}
        busy={busyId === entry.id}
        vars={varsState.vars}
        errors={errorsOf(entry)}
        show={(field) => showErrors(entry.id, field)}
        confirming={confirming === entry.id}
        onChange={(field) => onChange(entry.id, field)}
        onBlur={(field) => onBlurField(entry.id, field)}
        onToggleVisible={() => update(entry.id, (form) => ({ visible: !form.visible }))}
        onInsert={(token) => insert(token, ids)}
        onAsk={() => setConfirming(entry.id)}
        onCancel={() => setConfirming(null)}
        onConfirm={() => removeEntry(entry)}
      />
    )
  }

  return (
    <section aria-labelledby="titre-faq" className="pb-40 md:pb-28">
      <h1 id="titre-faq" className="text-2xl sm:text-3xl">
        FAQ
      </h1>
      <p className="mt-2 text-slate-700">
        Les questions fréquentes affichées sur le site. Les modifications ne sont visibles qu’après publication. Une question masquée reste ici mais disparaît du site.
      </p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement de la FAQ…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger la FAQ.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && (
        <>
          <VarsNotice state={varsState} onRetry={retryVars} />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" id="faq-ajout" onClick={addFaq} disabled={saving} className={`btn-outline touch-target ${focusRing}`}>
              Ajouter une question
            </button>
            {hasNew && <p className="text-sm text-slate-700">Enregistrez la nouvelle question avant de modifier l’ordre.</p>}
          </div>

          <div role="alert">{actionError && <p className="mt-4 text-sm font-semibold text-red-800">{actionError}</p>}</div>

          <div className="mt-6" onFocus={trackFocus}>
            {entries.length === 0 ? (
              <p role="status" className="card-surface text-slate-700">
                Aucune question : ajoutez-en une.
              </p>
            ) : (
              <OrderableList label="Questions" items={entries} getLabel={(entry) => entry.form.question.trim() || 'Nouvelle question'} disabled={hasNew || saving} onReorder={onReorder} renderItem={renderItem} />
            )}
          </div>

          {/* Régions vives toujours présentes. */}
          <p role="status" className="mt-4 text-sm font-semibold text-slate-700">
            {order.status === 'error' ? '' : order.message}
          </p>
          <div role="alert">{order.status === 'error' && <p className="mt-4 text-sm font-semibold text-red-800">{order.message}</p>}</div>
          <p role="status" aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </>
      )}

      {load.status === 'ready' && <SaveBar dirty={dirty} saving={saving} error={saveError} savedAt={savedAt} onSave={onSave} onCancel={onCancel} />}
    </section>
  )
}
