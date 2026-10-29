import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE_URL } from '../../data/site.js'
import { interpolate } from '../../lib/interpolate.js'
import { loadPagesSeo, savePageSeo } from '../api.js'
import Field from '../components/Field.jsx'
import SaveBar from '../components/SaveBar.jsx'
import TokenHelp, { VarsNotice } from '../components/TokenHelp.jsx'
import { tokenProblem } from '../draft-vars.js'
import { MAX_NAV_LABEL, parsePriority, validatePageSeo } from '../pages-map.js'
import { useDraftVars } from '../useDraftVars.js'
import { useFieldInsert } from '../useFieldInsert.js'
import { useUnsavedWarning } from '../useUnsavedWarning.js'
import { DESCRIPTION_LIMIT, DESCRIPTION_MIN, TITLE_LIMIT, seoPreview } from '../validation.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

const FIELD_ORDER = ['title', 'description', 'priority', 'navLabel']
const fieldId = (index, field) => `seo-${index}-${field}`
const FIELD_ID = /^seo-(\d+)-(title|description)$/

/**
 * Une page du formulaire : `base` = référencement enregistré, `form` = saisie en cours (la priorité est du texte).
 * @typedef {{ path: string, base: import('../pages-map.js').PageSeo, form: { title: string, description: string, priority: string, navLabel: string } }} Entry
 */

const formFromPage = (page) => ({
  title: page.title,
  description: page.description,
  priority: String(page.priority).replace('.', ','),
  navLabel: page.navLabel ?? '',
})
const toEntry = (page) => ({ path: page.path, base: page, form: formFromPage(page) })

const isDirty = ({ base, form }) => {
  const priority = parsePriority(form.priority)
  return (
    form.title !== base.title ||
    form.description !== base.description ||
    !priority.ok ||
    priority.value !== base.priority ||
    form.navLabel.trim() !== (base.navLabel ?? '')
  )
}

/** Valeurs prêtes à enregistrer (à n'appeler qu'une fois la saisie validée). */
const pageFromForm = (entry) => ({
  path: entry.path,
  title: entry.form.title.trim(),
  description: entry.form.description.trim(),
  priority: parsePriority(entry.form.priority).value,
  navLabel: entry.form.navLabel.trim() || null,
})

/** Texte tel qu'il sera affiché sur le site : variables connues remplacées, sinon texte inchangé. */
function rendered(text, vars) {
  try {
    return interpolate(text, vars)
  } catch {
    return text
  }
}

const STATUS_TEXT = {
  title: {
    ok: 'longueur conforme',
    long: 'trop long : le titre sera coupé dans Google',
    empty: 'titre manquant',
  },
  description: {
    ok: 'longueur conforme',
    long: 'trop longue : la description sera coupée dans Google',
    short: 'courte : visez au moins 70 caractères',
    empty: 'description manquante',
  },
}

function Counter({ id, length, limit, status, texts }) {
  const warn = status !== 'ok'
  return (
    <p id={id} className={`mt-1.5 text-sm ${warn ? 'font-semibold text-amber-900' : 'text-slate-700'}`}>
      {length}/{limit} caractères — {texts[status]}
    </p>
  )
}

function PageCard({ entry, index, disabled, vars, varsState, errors, show, onChange, onBlur, onInsert }) {
  const { form } = entry
  const preview = seoPreview(rendered(form.title, vars), rendered(form.description, vars))
  const titleId = fieldId(index, 'title')
  const descriptionId = fieldId(index, 'description')
  const heading = `seo-${index}-titre`

  return (
    <section aria-labelledby={heading} className="card-surface">
      <h2 id={heading} className="text-xl">
        <code>{entry.path}</code>
        {isDirty(entry) && <span className="ml-2 text-sm font-semibold text-slate-700">Non enregistrée</span>}
      </h2>
      <p className="mt-1 text-sm text-slate-700">Le chemin de la page ne se modifie pas.</p>

      <fieldset disabled={disabled} aria-labelledby={heading} className="mt-4 grid min-w-0 gap-5">
        <Field id={titleId} label={`Titre de la page ${entry.path}`} error={show('title') ? errors.title : undefined}>
          {(controlProps) => (
            <>
              <input
                {...controlProps}
                type="text"
                autoComplete="off"
                className="input-field"
                value={form.title}
                onChange={onChange('title')}
                onBlur={onBlur('title')}
                aria-describedby={[controlProps['aria-describedby'], `${titleId}-compteur`].filter(Boolean).join(' ')}
              />
              <Counter id={`${titleId}-compteur`} length={preview.titleLength} limit={TITLE_LIMIT} status={preview.titleStatus} texts={STATUS_TEXT.title} />
            </>
          )}
        </Field>

        <Field id={descriptionId} label={`Description de la page ${entry.path}`} error={show('description') ? errors.description : undefined}>
          {(controlProps) => (
            <>
              <textarea
                {...controlProps}
                rows={3}
                className="input-field"
                value={form.description}
                onChange={onChange('description')}
                onBlur={onBlur('description')}
                aria-describedby={[controlProps['aria-describedby'], `${descriptionId}-compteur`].filter(Boolean).join(' ')}
              />
              <Counter id={`${descriptionId}-compteur`} length={preview.descriptionLength} limit={DESCRIPTION_LIMIT} status={preview.descriptionStatus} texts={STATUS_TEXT.description} />
            </>
          )}
        </Field>

        <TokenHelp vars={vars} onInsert={onInsert} disabled={disabled} />

        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
          <p className="text-sm font-semibold text-slate-700">Aperçu dans Google</p>
          <p className="mt-2 break-all text-sm text-[#047857]">
            {SITE_URL}
            {entry.path}
          </p>
          <p className="mt-0.5 text-xl leading-snug text-[#1a0dab]">{preview.title || '(titre vide)'}</p>
          <p className="mt-1 text-sm text-slate-700">{preview.description || '(description vide)'}</p>
          {varsState.status !== 'ready' && <p className="mt-2 text-sm text-slate-700">Les variables ne sont pas chargées : l’aperçu montre les textes tels que saisis.</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={fieldId(index, 'priority')}
            label="Priorité dans le plan du site (de 0 à 1)"
            hint="Exemple : 0,8. Les pages de priorité inférieure à 0,5 ne figurent pas dans le plan du site."
            error={show('priority') ? errors.priority : undefined}
          >
            <input type="text" inputMode="decimal" autoComplete="off" className="input-field max-w-[8rem]" value={form.priority} onChange={onChange('priority')} onBlur={onBlur('priority')} />
          </Field>
          <Field
            id={fieldId(index, 'navLabel')}
            label="Libellé dans le menu (facultatif)"
            hint={`Texte du lien dans le menu du site, ${MAX_NAV_LABEL} caractères au plus. Vide : la page n’apparaît pas dans le menu.`}
            error={show('navLabel') ? errors.navLabel : undefined}
          >
            <input type="text" autoComplete="off" className="input-field" value={form.navLabel} onChange={onChange('navLabel')} onBlur={onBlur('navLabel')} />
          </Field>
        </div>
      </fieldset>
    </section>
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
  const [focusTick, setFocusTick] = useState(0)

  const { state: varsState, retry: retryVars } = useDraftVars()
  const focusTarget = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadPagesSeo()
      .then((pages) => {
        if (cancelled) return
        setEntries(pages.map(toEntry))
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

  const dirtyEntries = load.status === 'ready' ? entries.filter(isDirty) : []
  const dirty = dirtyEntries.length > 0
  // Dialogue « Quitter sans enregistrer ? » (navigation interne) + confirmation du navigateur (onglet).
  const leaveDialog = useUnsavedWarning(dirty)

  const errorsOf = (entry) => {
    const errors = validatePageSeo(entry.form)
    for (const field of ['title', 'description']) {
      if (errors[field]) continue
      const problem = tokenProblem(varsState, entry.form[field])
      if (problem) errors[field] = problem
    }
    return errors
  }
  const showErrors = (path, field) => attempted || Boolean(touched[`${path}:${field}`])

  const update = (path, field, value) => {
    setEntries((list) => list.map((entry) => (entry.path === path ? { ...entry, form: { ...entry.form, [field]: value } } : entry)))
    setSaveError(null)
  }

  const { trackFocus, insert } = useFieldInsert((id, value) => {
    const match = FIELD_ID.exec(id)
    if (!match) return
    const entry = entries[Number(match[1])]
    if (entry) update(entry.path, match[2], value)
  })

  const onSave = async () => {
    setAttempted(true)
    const invalid = dirtyEntries.filter((entry) => Object.keys(errorsOf(entry)).length > 0)
    if (invalid.length > 0) {
      setSaveError(invalid.length === 1 ? 'Enregistrement impossible : 1 page est à corriger.' : `Enregistrement impossible : ${invalid.length} pages sont à corriger.`)
      const first = invalid[0]
      const errors = errorsOf(first)
      focusTarget.current = fieldId(entries.indexOf(first), FIELD_ORDER.find((field) => errors[field]))
      setFocusTick((n) => n + 1)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      for (const entry of dirtyEntries) {
        const stored = await savePageSeo(pageFromForm(entry))
        setEntries((list) => list.map((candidate) => (candidate.path === entry.path ? toEntry(stored) : candidate)))
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
    setEntries((list) => list.map((entry) => toEntry(entry.base)))
    setTouched({})
    setAttempted(false)
    setSaveError(null)
  }

  return (
    <section aria-labelledby="titre-referencement" className="pb-40 md:pb-28">
      {leaveDialog}
      <h1 id="titre-referencement" className="text-2xl sm:text-3xl">
        Référencement
      </h1>
      <p className="mt-2 text-slate-700">
        Le titre et la description de chaque page, tels que les moteurs de recherche les affichent. Les modifications ne sont visibles qu’après publication. Les pages sont fixées par le site : on ne peut ni en ajouter ni en retirer.
      </p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement du référencement…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger le référencement.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && entries.length === 0 && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Aucune page enregistrée : importez les données initiales (voir le README).
        </p>
      )}

      {load.status === 'ready' && entries.length > 0 && (
        <>
          <VarsNotice state={varsState} onRetry={retryVars} />
          <p className="mt-4 text-sm text-slate-700">
            Titre conseillé : {TITLE_LIMIT} caractères au plus. Description conseillée : de {DESCRIPTION_MIN} à {DESCRIPTION_LIMIT} caractères. Les compteurs comptent le texte une fois les variables remplacées.
          </p>
          <div className="mt-6 grid gap-6" onFocus={trackFocus}>
            {entries.map((entry, index) => {
              const ids = [fieldId(index, 'description'), fieldId(index, 'title')]
              return (
                <PageCard
                  key={entry.path}
                  entry={entry}
                  index={index}
                  disabled={saving}
                  vars={varsState.vars}
                  varsState={varsState}
                  errors={errorsOf(entry)}
                  show={(field) => showErrors(entry.path, field)}
                  onChange={(field) => (event) => update(entry.path, field, event.target.value)}
                  onBlur={(field) => () => setTouched((t) => ({ ...t, [`${entry.path}:${field}`]: true }))}
                  onInsert={(token) => insert(token, ids)}
                />
              )
            })}
          </div>
        </>
      )}

      {load.status === 'ready' && entries.length > 0 && <SaveBar dirty={dirty} saving={saving} error={saveError} savedAt={savedAt} onSave={onSave} onCancel={onCancel} />}
    </section>
  )
}
