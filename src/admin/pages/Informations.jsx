import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadSettings, saveSettings } from '../api.js'
import Field from '../components/Field.jsx'
import SaveBar from '../components/SaveBar.jsx'
import { formFromSettings, settingsFromForm, validateSettings } from '../settings-map.js'
import { useUnsavedWarning } from '../useUnsavedWarning.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

/**
 * Groupes de champs, dans l'ordre d'affichage (et de focus en cas d'erreur).
 * `securitySummary` n'y figure pas : il n'est affiché nulle part sur le site ; sa valeur stockée est recopiée telle quelle
 * à l'enregistrement (voir `PRESERVED_KEYS` dans settings-map.js).
 */
const GROUPS = [
  {
    title: 'Contact',
    fields: [
      { key: 'phone', label: 'Téléphone', hint: 'Affiché sur le site, par exemple +261 34 21 410 31.', type: 'tel', autoComplete: 'off' },
      { key: 'whatsappNumber', label: 'Numéro WhatsApp', hint: 'Chiffres seulement, sans « + » ni espace, par exemple 261342141031.', inputMode: 'numeric' },
      { key: 'email', label: 'Adresse e-mail', type: 'email', autoComplete: 'off' },
      { key: 'facebookUrl', label: 'Page Facebook', hint: 'Adresse complète, commençant par https://', type: 'url' },
      { key: 'messengerUrl', label: 'Lien Messenger', hint: 'Adresse complète, commençant par https://', type: 'url' },
      { key: 'facebookFollowers', label: 'Nombre d’abonnés Facebook', inputMode: 'numeric' },
    ],
  },
  {
    title: 'Adresse',
    fields: [
      { key: 'street', label: 'Rue ou lieu-dit' },
      { key: 'city', label: 'Ville' },
      { key: 'postalCode', label: 'Code postal' },
      { key: 'country', label: 'Pays' },
      { key: 'countryCode', label: 'Code du pays', hint: 'Deux lettres majuscules, par exemple MG.' },
      { key: 'latitude', label: 'Latitude', hint: 'Par exemple -18.945199.', inputMode: 'decimal' },
      { key: 'longitude', label: 'Longitude', hint: 'Par exemple 47.431368.', inputMode: 'decimal' },
    ],
  },
  {
    title: 'Horaires et chambres',
    fields: [
      { key: 'hoursLabel', label: 'Horaires affichés', hint: 'Par exemple « De 8h à 21h ».' },
      { key: 'openHour', label: 'Heure d’ouverture', hint: 'Heure entière de 0 à 23 (pour Google).', inputMode: 'numeric' },
      { key: 'closeHour', label: 'Heure de fermeture', hint: 'Heure entière de 0 à 23, après l’ouverture.', inputMode: 'numeric' },
      { key: 'roomCheckIn', label: 'Arrivée dans les chambres', hint: 'Par exemple « 10h ».' },
      { key: 'roomCheckOut', label: 'Départ des chambres', hint: 'Par exemple « 10h le lendemain ».' },
    ],
  },
  {
    title: 'Sécurité',
    fields: [
      { key: 'securityPartnerName', label: 'Nom du partenaire de sécurité', hint: 'Facultatif, à remplir avec l’adresse ci-dessous. Laissez les deux champs vides pour ne citer aucun partenaire sur le site.' },
      { key: 'securityPartnerUrl', label: 'Site du partenaire de sécurité', hint: 'Facultatif, commençant par https://', type: 'url' },
    ],
  },
  {
    title: 'Présentation',
    fields: [
      { key: 'name', label: 'Nom de l’établissement' },
      { key: 'tagline', label: 'Phrase d’accroche', multiline: true },
    ],
  },
]

const FIELD_ORDER = GROUPS.flatMap((g) => g.fields.map((f) => f.key))
const fieldId = (key) => `info-${key}`

const sameForm = (a, b) => FIELD_ORDER.every((key) => (a[key] ?? '') === (b[key] ?? ''))

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error', message } | { status: 'ready', empty }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [values, setValues] = useState(() => formFromSettings(null))
  const [saved, setSaved] = useState(() => formFromSettings(null))
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadSettings()
      .then((settings) => {
        if (cancelled) return
        const form = formFromSettings(settings)
        setValues(form)
        setSaved(form)
        setLoad({ status: 'ready', empty: settings === null })
      })
      .catch((error) => {
        if (!cancelled) setLoad({ status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  const errors = useMemo(() => validateSettings(values), [values])
  const dirty = load.status === 'ready' && !sameForm(values, saved)
  useUnsavedWarning(dirty)

  const visibleError = (key) => (attempted || touched[key] ? errors[key] : undefined)

  const onChange = (key) => (event) => {
    setValues((v) => ({ ...v, [key]: event.target.value }))
    setSaveError(null)
  }
  const onBlur = (key) => () => setTouched((t) => ({ ...t, [key]: true }))

  const onSave = async () => {
    setAttempted(true)
    const invalid = FIELD_ORDER.filter((key) => errors[key])
    if (invalid.length > 0) {
      setSaveError(
        invalid.length === 1 ? 'Enregistrement impossible : 1 champ est à corriger.' : `Enregistrement impossible : ${invalid.length} champs sont à corriger.`,
      )
      document.getElementById(fieldId(invalid[0]))?.focus()
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const settings = settingsFromForm(values)
      await saveSettings(settings)
      const form = formFromSettings(settings)
      setValues(form)
      setSaved(form)
      setSavedAt(new Date())
      setLoad((l) => ({ ...l, empty: false }))
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    setValues(saved)
    setTouched({})
    setAttempted(false)
    setSaveError(null)
  }

  return (
    <section aria-labelledby="titre-informations" className="pb-40 md:pb-28">
      <h1 id="titre-informations" className="text-2xl sm:text-3xl">
        Informations
      </h1>
      <p className="mt-2 text-slate-700">Coordonnées, adresse, horaires et sécurité affichés sur le site. Les modifications ne sont visibles qu’après publication.</p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement des informations…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger les informations.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (dirty && !saving) onSave()
          }}
          className="mt-6 space-y-6"
        >
          {load.empty && (
            <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-950 ring-1 ring-amber-300">
              Aucune information enregistrée : remplissez le formulaire puis enregistrez.
            </p>
          )}
          {GROUPS.map((group) => (
            <fieldset key={group.title} className="card-surface">
              <legend className="font-display text-xl font-semibold text-[#2B211B]">{group.title}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <Field
                    key={field.key}
                    id={fieldId(field.key)}
                    label={field.label}
                    hint={field.hint}
                    error={visibleError(field.key)}
                    className={field.multiline ? 'sm:col-span-2' : ''}
                  >
                    {(controlProps) =>
                      field.multiline ? (
                        <textarea {...controlProps} rows={3} className="input-field" value={values[field.key]} onChange={onChange(field.key)} onBlur={onBlur(field.key)} />
                      ) : (
                        <input
                          {...controlProps}
                          type={field.type ?? 'text'}
                          inputMode={field.inputMode}
                          autoComplete={field.autoComplete ?? 'off'}
                          className="input-field"
                          value={values[field.key]}
                          onChange={onChange(field.key)}
                          onBlur={onBlur(field.key)}
                        />
                      )
                    }
                  </Field>
                ))}
              </div>
            </fieldset>
          ))}
        </form>
      )}

      {load.status === 'ready' && (
        <SaveBar dirty={dirty} saving={saving} error={saveError} savedAt={savedAt} onSave={onSave} onCancel={onCancel} />
      )}
    </section>
  )
}
