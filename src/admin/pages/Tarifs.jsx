import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadPrices, savePrices } from '../api.js'
import Field from '../components/Field.jsx'
import SaveBar from '../components/SaveBar.jsx'
import { useUnsavedWarning } from '../useUnsavedWarning.js'
import { parseAmount, parseCount } from '../validation.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

const UNIT_LABEL = { ar: 'Ar', personnes: 'personnes' }
const priceId = (key) => `tarif-${key}`

/** Le nombre d'invités est borné ; les autres tarifs sont des montants en ariary. */
const parsePrice = (price, text) =>
  price.key === 'reception_max_invites' ? parseCount(text, { min: 1, max: 1000 }) : parseAmount(text)

/** Affichage lisible avec séparateur de milliers (« 150 000 »). */
const display = (amount) => amount.toLocaleString('fr-FR').replace(/[\u00A0\u202F]/g, ' ')

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error' } | { status: 'ready' }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [prices, setPrices] = useState([])
  const [values, setValues] = useState({})
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)

  const applyPrices = useCallback((rows) => {
    setPrices(rows)
    setValues(Object.fromEntries(rows.map((p) => [p.key, display(p.amount)])))
  }, [])

  useEffect(() => {
    let cancelled = false
    loadPrices()
      .then((rows) => {
        if (cancelled) return
        applyPrices(rows)
        setLoad({ status: 'ready' })
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt, applyPrices])

  const retry = useCallback(() => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  // Pour chaque tarif : résultat de l'analyse de la saisie.
  const parsed = useMemo(
    () => Object.fromEntries(prices.map((p) => [p.key, parsePrice(p, values[p.key] ?? '')])),
    [prices, values],
  )
  const changed = prices.filter((p) => !parsed[p.key].ok || parsed[p.key].value !== p.amount)
  const dirty = load.status === 'ready' && changed.length > 0
  // Dialogue « Quitter sans enregistrer ? » (navigation interne) + confirmation du navigateur (onglet).
  const leaveDialog = useUnsavedWarning(dirty)

  const errorFor = (p) => (attempted || touched[p.key]) && !parsed[p.key].ok ? parsed[p.key].error : undefined

  const onChange = (key) => (event) => {
    setValues((v) => ({ ...v, [key]: event.target.value }))
    setSaveError(null)
  }
  const onBlur = (p) => () => {
    setTouched((t) => ({ ...t, [p.key]: true }))
    const result = parsed[p.key]
    if (result.ok) setValues((v) => ({ ...v, [p.key]: display(result.value) }))
  }

  const onSave = async () => {
    setAttempted(true)
    const invalid = prices.filter((p) => !parsed[p.key].ok)
    if (invalid.length > 0) {
      setSaveError(
        invalid.length === 1 ? 'Enregistrement impossible : 1 tarif est à corriger.' : `Enregistrement impossible : ${invalid.length} tarifs sont à corriger.`,
      )
      document.getElementById(priceId(invalid[0].key))?.focus()
      return
    }
    setSaving(true)
    setSaveError(null)
    const toSave = changed.map((p) => ({ key: p.key, label: p.label, amount: parsed[p.key].value }))
    try {
      await savePrices(toSave)
      applyPrices(prices.map((p) => ({ ...p, amount: parsed[p.key].value })))
      setSavedAt(new Date())
    } catch (error) {
      setSaveError(error.message)
      // Certains tarifs ont pu être enregistrés avant l'échec : on relit la base sans toucher à la saisie.
      loadPrices()
        .then(setPrices)
        .catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    applyPrices(prices)
    setTouched({})
    setAttempted(false)
    setSaveError(null)
  }

  return (
    <section aria-labelledby="titre-tarifs" className="pb-40 md:pb-28">
      {leaveDialog}
      <h1 id="titre-tarifs" className="text-2xl sm:text-3xl">
        Tarifs
      </h1>
      <p className="mt-2 text-slate-700">Les prix affichés sur le site. Les modifications ne sont visibles qu’après publication.</p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement des tarifs…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger les tarifs.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && prices.length === 0 && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Aucun tarif en base : le contenu initial doit d’abord être importé.
        </p>
      )}

      {load.status === 'ready' && prices.length > 0 && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (dirty && !saving) onSave()
          }}
          className="card-surface mt-6"
        >
          <ul className="grid gap-5">
            {prices.map((p) => (
              <li key={p.key}>
                <Field id={priceId(p.key)} label={p.label} error={errorFor(p)}>
                  {(controlProps) => (
                    <div className="flex items-center gap-3">
                      <input
                        {...controlProps}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        className="input-field max-w-xs"
                        value={values[p.key] ?? ''}
                        onChange={onChange(p.key)}
                        onBlur={onBlur(p)}
                      />
                      <span className="font-semibold text-slate-700">{UNIT_LABEL[p.unit] ?? p.unit}</span>
                    </div>
                  )}
                </Field>
              </li>
            ))}
          </ul>
        </form>
      )}

      {load.status === 'ready' && prices.length > 0 && (
        <SaveBar dirty={dirty} saving={saving} error={saveError} savedAt={savedAt} onSave={onSave} onCancel={onCancel} />
      )}
    </section>
  )
}
