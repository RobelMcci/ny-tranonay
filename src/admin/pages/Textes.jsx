import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { textSlots } from '../../data/text-slots.js'
import { loadTexts, saveTexts } from '../api.js'
import Field from '../components/Field.jsx'
import SaveBar from '../components/SaveBar.jsx'
import TokenHelp, { VarsNotice } from '../components/TokenHelp.jsx'
import { tokenProblem } from '../draft-vars.js'
import { useDraftVars } from '../useDraftVars.js'
import { useFieldInsert } from '../useFieldInsert.js'
import { useUnsavedWarning } from '../useUnsavedWarning.js'
import { TEXT_LIMIT, TEXT_LIMIT_MULTILINE, effectiveTexts, textChanges, validateText } from '../validation.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

/** Groupes d'écran, dans l'ordre des pages du site. */
const GROUPS = [
  { page: 'accueil', title: 'Accueil' },
  { page: 'salle', title: 'Salle & réceptions' },
  { page: 'privatisation', title: 'Privatisation & piscine' },
  { page: 'chambres', title: 'Chambres' },
  { page: 'tarifs', title: 'Tarifs & devis' },
  { page: 'contact', title: 'Contact' },
].map((group) => ({ ...group, slots: textSlots.filter((slot) => slot.page === group.page) }))

const ID_PREFIX = 'texte-'
const fieldId = (key) => `${ID_PREFIX}${key}`
const keyFromId = (id) => (id.startsWith(ID_PREFIX) && textSlots.some((slot) => slot.key === id.slice(ID_PREFIX.length)) ? id.slice(ID_PREFIX.length) : null)

const hasOverride = (overrides, key) => Object.hasOwn(overrides, key) && typeof overrides[key] === 'string' && overrides[key].trim() !== ''

function TextField({ slot, value, hasStored, disabled, error, dirty, onChange, onBlur, onReset }) {
  const id = fieldId(slot.key)
  const limit = slot.multiline ? TEXT_LIMIT_MULTILINE : TEXT_LIMIT
  const length = Array.from(value.trim()).length
  const trimmed = value.trim()
  const modified = trimmed !== '' && trimmed !== slot.default
  const resetDisabled = disabled || (value === slot.default && !hasStored)
  const counterId = `${id}-compteur`

  return (
    <div>
      <Field id={id} label={slot.label} error={error}>
        {(controlProps) => {
          const props = {
            ...controlProps,
            autoComplete: 'off',
            className: 'input-field',
            value,
            onChange,
            onBlur,
            'aria-describedby': [controlProps['aria-describedby'], counterId].filter(Boolean).join(' '),
          }
          return slot.multiline ? <textarea {...props} rows={4} /> : <input {...props} type="text" />
        }}
      </Field>
      <p id={counterId} className={`mt-1.5 text-sm ${length > limit ? 'font-semibold text-red-800' : 'text-slate-700'}`}>
        {length}/{limit} caractères
        {modified && <span className="ml-2 font-semibold text-[#9A3412]">Modifié</span>}
        {dirty && <span className="ml-2 font-semibold text-slate-700">Non enregistré</span>}
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <details className="min-w-0 flex-1 basis-60 text-sm text-slate-700">
          <summary className={`touch-target inline-flex cursor-pointer items-center rounded-full px-2 font-semibold underline underline-offset-2 ${focusRing}`}>Texte d’origine</summary>
          <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">{slot.default}</p>
        </details>
        <button
          type="button"
          disabled={resetDisabled}
          onClick={onReset}
          className={`touch-target rounded-full px-2 text-sm font-semibold text-[#9A3412] underline underline-offset-2 disabled:opacity-50 ${focusRing}`}
        >
          Rétablir le texte d’origine<span className="sr-only"> : {slot.label}</span>
        </button>
      </div>
    </div>
  )
}

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error' } | { status: 'ready' }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  /** Surcharges enregistrées (clé → texte). */
  const [overrides, setOverrides] = useState({})
  /** Saisie en cours (clé → texte). */
  const [form, setForm] = useState({})
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const [focusTick, setFocusTick] = useState(0)

  const { state: varsState, retry: retryVars } = useDraftVars()
  const focusTarget = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadTexts()
      .then((stored) => {
        if (cancelled) return
        setOverrides(stored)
        setForm(effectiveTexts(textSlots, stored))
        setLoad({ status: 'ready' })
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Le focus est déplacé une fois les erreurs affichées.
  useEffect(() => {
    if (focusTick === 0 || !focusTarget.current) return
    const target = document.getElementById(focusTarget.current)
    focusTarget.current = null
    target?.focus()
  }, [focusTick])

  const retry = useCallback(() => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  // Texte affiché sur le site pour chaque emplacement d'après les surcharges enregistrées.
  const base = useMemo(() => effectiveTexts(textSlots, overrides), [overrides])
  const ready = load.status === 'ready'
  const dirtySlots = ready ? textSlots.filter((slot) => form[slot.key] !== base[slot.key]) : []
  const dirty = dirtySlots.length > 0
  useUnsavedWarning(dirty)

  const errorOf = (slot) => {
    const value = form[slot.key] ?? ''
    const problem = validateText(slot, value)
    if (problem) return problem
    // Un champ vide ou égal au défaut ne crée pas de surcharge : ses variables n'ont pas à être vérifiées.
    if (value.trim() === '' || value.trim() === slot.default) return null
    return tokenProblem(varsState, value.trim())
  }
  const showError = (key) => attempted || Boolean(touched[key])

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setSaveError(null)
  }

  const { trackFocus, insert } = useFieldInsert((id, value) => {
    const key = keyFromId(id)
    if (key) update(key, value)
  })

  const onSave = async () => {
    setAttempted(true)
    const invalid = textSlots.filter((slot) => dirtySlots.includes(slot) && errorOf(slot))
    if (invalid.length > 0) {
      setSaveError(invalid.length === 1 ? 'Enregistrement impossible : 1 texte est à corriger.' : `Enregistrement impossible : ${invalid.length} textes sont à corriger.`)
      const first = GROUPS.flatMap((group) => group.slots).find((slot) => invalid.includes(slot))
      focusTarget.current = fieldId(first.key)
      setFocusTick((n) => n + 1)
      return
    }
    setSaving(true)
    setSaveError(null)
    const changes = textChanges(dirtySlots, form, overrides)
    try {
      await saveTexts(changes)
      // Les surcharges enregistrées sont déduites de ce qui vient d'être écrit ; les champs enregistrés montrent le texte retenu.
      const next = { ...overrides }
      for (const { key, value } of changes.upserts) next[key] = value
      for (const key of changes.deletes) delete next[key]
      const stored = effectiveTexts(textSlots, next)
      setOverrides(next)
      setForm((current) => ({ ...current, ...Object.fromEntries(dirtySlots.map((slot) => [slot.key, stored[slot.key]])) }))
      setSavedAt(new Date())
      setAttempted(false)
      setTouched({})
    } catch (error) {
      setSaveError(error.message)
      // Un échec partiel (enregistrement réussi, retour au défaut raté) laisse la base différente de l'écran : on la relit.
      loadTexts()
        .then((stored) => setOverrides(stored))
        .catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    setForm(base)
    setTouched({})
    setAttempted(false)
    setSaveError(null)
  }

  return (
    <section aria-labelledby="titre-textes" className="pb-40 md:pb-28">
      <h1 id="titre-textes" className="text-2xl sm:text-3xl">
        Textes des pages
      </h1>
      <p className="mt-2 text-slate-700">
        Les titres et textes d’introduction des pages. Un champ laissé au texte d’origine garde le texte actuel du site. Les modifications ne sont visibles qu’après publication. Les emplacements sont fixés par le site : on ne peut ni en ajouter ni en retirer.
      </p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement des textes…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger les textes.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {ready && (
        <>
          <VarsNotice state={varsState} onRetry={retryVars} />
          <div className="mt-6 grid gap-6" onFocus={trackFocus}>
            {GROUPS.map((group) => {
              const heading = `textes-${group.page}`
              const ids = group.slots.map((slot) => fieldId(slot.key))
              return (
                <section key={group.page} aria-labelledby={heading} className="card-surface">
                  <h2 id={heading} className="text-xl">
                    {group.title}
                  </h2>
                  <fieldset disabled={saving} aria-labelledby={heading} className="mt-4 grid min-w-0 gap-6">
                    {group.slots.map((slot) => (
                      <TextField
                        key={slot.key}
                        slot={slot}
                        value={form[slot.key] ?? ''}
                        hasStored={hasOverride(overrides, slot.key)}
                        disabled={saving}
                        error={showError(slot.key) ? errorOf(slot) : undefined}
                        dirty={form[slot.key] !== base[slot.key]}
                        onChange={(event) => update(slot.key, event.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, [slot.key]: true }))}
                        onReset={() => update(slot.key, slot.default)}
                      />
                    ))}
                    <TokenHelp vars={varsState.vars} onInsert={(token) => insert(token, ids)} disabled={saving} />
                  </fieldset>
                </section>
              )
            })}
          </div>
        </>
      )}

      {ready && <SaveBar dirty={dirty} saving={saving} error={saveError} savedAt={savedAt} onSave={onSave} onCancel={onCancel} />}
    </section>
  )
}
