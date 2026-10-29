import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clearPhotoSlot, deletePhoto, loadPhotoSlots, loadPhotos, loadRooms, savePhotoMeta, setPhotoSlot, uploadPhoto } from '../api.js'
import ConfirmRemove from '../components/ConfirmRemove.jsx'
import Field from '../components/Field.jsx'
import PhotoThumb from '../components/PhotoThumb.jsx'
import SaveBar from '../components/SaveBar.jsx'
import SlotPicker from '../components/SlotPicker.jsx'
import { fixedPhotoUsages, photoSlots } from '../../data/photo-slots.js'
import { imageTypeError, resizeToJpeg } from '../image.js'
import {
  MAX_ALT,
  categoriesOf,
  effectiveSlotPhoto,
  formFromPhoto,
  isPhotoDirty,
  photoChangeBlock,
  photoMetaFromForm,
  photoUsages,
  validatePhotoMeta,
} from '../photos-map.js'
import { useUnsavedWarning } from '../useUnsavedWarning.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

const NEW_CATEGORY = '__nouvelle__'
const ACCEPT = 'image/jpeg,image/png,image/webp'
const TABS = [
  { id: 'bibliotheque', label: 'Bibliothèque' },
  { id: 'emplacements', label: 'Emplacements' },
]

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`
const fieldId = (key, field) => `photo-${key}-${field}`
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

/** @typedef {{ id: string, base: import('../photos-map.js').Photo, form: ReturnType<typeof formFromPhoto> }} Entry */
const toEntry = (photo) => ({ id: photo.key, base: photo, form: formFromPhoto(photo) })
const toEntryFromBase = (entry) => ({ ...entry, form: formFromPhoto(entry.base) })

/** Catégorie : liste des catégories existantes + « Nouvelle catégorie… » (saisie libre). */
function CategoryField({ id, label, value, categories, error, disabled, onChange, onBlur }) {
  const [forceNew, setForceNew] = useState(false)
  const listed = categories.includes(value)
  const isNew = forceNew || (value !== '' && !listed)
  const selectValue = isNew ? NEW_CATEGORY : listed ? value : ''
  return (
    <Field id={id} label={label} error={error}>
      {(control) => (
        <div className="grid gap-2">
          <select
            {...control}
            className="input-field"
            value={selectValue}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(event) => {
              const next = event.target.value
              if (next === NEW_CATEGORY) {
                setForceNew(true)
                onChange('')
              } else {
                setForceNew(false)
                onChange(next)
              }
            }}
          >
            <option value="" disabled>
              Choisir une catégorie
            </option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>Nouvelle catégorie…</option>
          </select>
          {isNew && (
            <input
              {...control}
              id={`${id}-nouvelle`}
              type="text"
              autoComplete="off"
              aria-label={`${label} : nom de la nouvelle catégorie`}
              placeholder="Nom de la nouvelle catégorie"
              className="input-field"
              value={value}
              disabled={disabled}
              onBlur={onBlur}
              onChange={(event) => onChange(event.target.value)}
            />
          )}
        </div>
      )}
    </Field>
  )
}

/** Téléversement : fichier, texte alternatif et catégorie obligatoires ; redimensionnement dans le navigateur puis envoi. */
function UploadForm({ categories, existingKeys, onUploaded, onBusyChange, announce }) {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [alt, setAlt] = useState('')
  const [altTouched, setAltTouched] = useState(false)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [focusTick, setFocusTick] = useState(0)

  const busy = status !== 'idle'
  const errors = validatePhotoMeta({ alt, category, galleryPosition: '' })
  const missing = !file ? 'Choisissez une photo pour pouvoir l’envoyer.' : errors.alt ? 'Saisissez le texte alternatif pour pouvoir envoyer la photo.' : errors.category ? 'Choisissez ou saisissez une catégorie pour pouvoir envoyer la photo.' : null

  useEffect(() => {
    if (focusTick > 0) document.getElementById('photo-envoi-fichier')?.focus()
  }, [focusTick])

  const onFile = (event) => {
    const chosen = event.target.files?.[0] ?? null
    setError(null)
    const problem = chosen ? imageTypeError(chosen) : null
    setFileError(problem)
    setFile(problem ? null : chosen)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy || missing) return
    setError(null)
    onBusyChange(true)
    setStatus('resizing')
    try {
      const { blob, width, height } = await resizeToJpeg(file)
      setStatus('sending')
      const photo = await uploadPhoto({ blob, width, height, alt: alt.trim(), category: category.trim(), existingKeys })
      onUploaded(photo)
      setFile(null)
      setAlt('')
      setAltTouched(false)
      setFileInputKey((n) => n + 1)
      announce(`Photo « ${photo.alt} » ajoutée en haut de la bibliothèque.`)
      setFocusTick((n) => n + 1)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setStatus('idle')
      onBusyChange(false)
    }
  }

  const label = status === 'resizing' ? 'Redimensionnement…' : status === 'sending' ? 'Envoi…' : 'Envoyer la photo'

  return (
    <form onSubmit={submit} className="card-surface" aria-labelledby="photo-envoi-titre" noValidate>
      <h3 id="photo-envoi-titre" className="text-xl">
        Ajouter une photo
      </h3>
      <p className="mt-1 text-sm text-slate-700">Formats JPEG, PNG ou WebP. La photo est réduite à 2 000 px et 2 Mo au plus avant l’envoi.</p>
      <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4">
        <Field id="photo-envoi-fichier" label="Photo" error={fileError}>
          <input key={fileInputKey} type="file" accept={ACCEPT} className="input-field" onChange={onFile} />
        </Field>
        <Field id="photo-envoi-alt" label="Texte alternatif (obligatoire)" hint={`Décrivez la photo pour les personnes qui ne la voient pas. ${MAX_ALT} caractères au plus.`} error={altTouched && errors.alt ? errors.alt : undefined}>
          <textarea
            rows={2}
            className="input-field"
            value={alt}
            onChange={(event) => {
              setAlt(event.target.value)
              setError(null)
            }}
            onBlur={() => setAltTouched(true)}
          />
        </Field>
        <CategoryField id="photo-envoi-categorie" label="Catégorie" value={category} categories={categories} disabled={busy} onChange={setCategory} error={category !== '' && errors.category ? errors.category : undefined} />
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="submit" disabled={busy || Boolean(missing)} aria-describedby="photo-envoi-aide" className={`btn-primary touch-target ${focusRing}`}>
          {label}
        </button>
        <p id="photo-envoi-aide" className="text-sm text-slate-700">
          {missing && !busy ? missing : ''}
        </p>
      </div>
      <p role="status" className="mt-3 text-sm font-semibold text-slate-700">
        {busy ? label : ''}
      </p>
      <div role="alert">{error && <p className="mt-3 text-sm font-semibold text-red-800">{error}</p>}</div>
    </form>
  )
}

function PhotoCard({ entry, categories, disabled, busy, errors, show, usage, fixed, notice, confirming, onChange, onBlur, onToggleVisible, onAsk, onCancel, onConfirm }) {
  const { base, form } = entry
  const title = form.alt.trim() || base.alt
  const dirty = isPhotoDirty(entry)
  const source = base.file ? 'Fichier du site' : 'Téléversée'
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <PhotoThumb photo={base} size={96} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-700">
          {source} · {base.width} × {base.height} px
          {!base.visible && ' · Masquée sur le site'}
          {dirty && ' · Modifications non enregistrées'}
        </p>
        <fieldset disabled={disabled || busy} aria-label={`Photo : ${title}`} className="mt-3 grid min-w-0 gap-4">
          <Field id={fieldId(entry.id, 'alt')} label="Texte alternatif" hint={`${MAX_ALT} caractères au plus.`} error={show('alt') ? errors.alt : undefined}>
            <textarea rows={2} className="input-field" value={form.alt} onChange={(event) => onChange('alt', event.target.value)} onBlur={() => onBlur('alt')} />
          </Field>
          <CategoryField id={fieldId(entry.id, 'categorie')} label="Catégorie" value={form.category} categories={categories} disabled={disabled || busy} error={show('category') ? errors.category : undefined} onChange={(value) => onChange('category', value)} onBlur={() => onBlur('category')} />
          <Field
            id={fieldId(entry.id, 'rang')}
            label="Rang dans la galerie"
            hint="Vide : la photo n’est pas dans la galerie. 0 : première position."
            error={show('galleryPosition') ? errors.galleryPosition : undefined}
          >
            <input type="text" inputMode="numeric" autoComplete="off" className="input-field sm:max-w-40" value={form.galleryPosition} onChange={(event) => onChange('galleryPosition', event.target.value)} onBlur={() => onBlur('galleryPosition')} />
          </Field>
          <label className="touch-target flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#2B211B]">
            <input id={fieldId(entry.id, 'visible')} type="checkbox" role="switch" className="h-6 w-11 shrink-0 accent-[#C2410C]" checked={form.visible} onChange={onToggleVisible} />
            <span>
              Visible sur le site<span className="sr-only"> : « {title} »</span>
            </span>
          </label>
          {notice && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-900 ring-1 ring-red-200">
              {notice}
            </p>
          )}
        </fieldset>
        <div className="mt-3">
          {usage.blocking ? (
            <details className="text-sm text-slate-700">
              <summary className={`touch-target cursor-pointer py-2 font-semibold text-[#2B211B] ${focusRing}`}>
                Utilisée à {count(usage.usages.length, 'endroit', 'endroits')} : suppression et masquage impossibles<span className="sr-only"> pour « {title} »</span>
              </summary>
              <p className="mt-1">
                {fixed
                  ? `Cette photo est utilisée à un emplacement fixe du site (${fixed}) : elle ne peut pas être masquée ni supprimée.`
                  : 'Cette photo ne peut être ni supprimée ni masquée tant qu’elle est utilisée. Choisissez une autre photo à ces endroits :'}
              </p>
              <ul className="mt-1 list-disc pl-6">
                {usage.usages.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          ) : (
            <ConfirmRemove label={title} from="de la bibliothèque" confirming={confirming} busy={disabled || busy} onAsk={onAsk} onCancel={onCancel} onConfirm={onConfirm} />
          )}
        </div>
      </div>
    </div>
  )
}

/** Bibliothèque : téléversement, filtre par catégorie, modification et suppression. */
function Library({ entries, setEntries, usageContext, announce }) {
  const [filter, setFilter] = useState('')
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const [notices, setNotices] = useState({})
  const [actionError, setActionError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const focusTarget = useRef(null)

  const dirtyEntries = entries.filter(isPhotoDirty)
  const dirty = dirtyEntries.length > 0
  useUnsavedWarning(dirty || uploading)

  // Le focus est déplacé une fois les erreurs et les nouveaux éléments affichés (liste d'identifiants candidats).
  useEffect(() => {
    if (focusTick === 0 || !focusTarget.current) return
    const target = focusTarget.current.map((id) => document.getElementById(id)).find(Boolean)
    focusTarget.current = null
    target?.focus()
  }, [focusTick])
  const focusAfterRender = (...ids) => {
    focusTarget.current = ids
    setFocusTick((n) => n + 1)
  }

  const bases = useMemo(() => entries.map((entry) => entry.base), [entries])
  const categories = useMemo(() => categoriesOf(bases), [bases])
  const shown = entries.filter((entry) => !filter || entry.base.category === filter)
  const errorsOf = (entry) => validatePhotoMeta(entry.form)
  const showErrors = (id, field) => attempted || Boolean(touched[`${id}:${field}`])

  const update = (id, change) => {
    setEntries((list) => list.map((entry) => (entry.id === id ? { ...entry, form: { ...entry.form, ...change } } : entry)))
    setSaveError(null)
    setSavedAt(null)
  }

  const onToggleVisible = (entry) => {
    const next = !entry.form.visible
    if (!next) {
      const reason = photoChangeBlock({ ...usageContext, photoKey: entry.id, action: 'hide' })
      if (reason) {
        setNotices((current) => ({ ...current, [entry.id]: reason }))
        return
      }
    }
    setNotices((current) => ({ ...current, [entry.id]: null }))
    update(entry.id, { visible: next })
  }

  const removeEntry = async (entry) => {
    setActionError(null)
    setWarning(null)
    setBusyId(entry.id)
    try {
      const { warning: leftover } = await deletePhoto(entry.base)
      setEntries((list) => list.filter((candidate) => candidate.id !== entry.id))
      setConfirming(null)
      announce(`Photo « ${entry.base.alt} » supprimée.`)
      if (leftover) setWarning(leftover)
      focusAfterRender('photos-filtre')
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const onSave = async () => {
    setAttempted(true)
    const invalid = dirtyEntries.filter((entry) => Object.keys(errorsOf(entry)).length > 0)
    if (invalid.length > 0) {
      setSaveError(invalid.length === 1 ? 'Enregistrement impossible : 1 photo est à corriger.' : `Enregistrement impossible : ${invalid.length} photos sont à corriger.`)
      const first = invalid[0]
      const errors = errorsOf(first)
      const field = errors.alt ? ['alt'] : errors.category ? ['categorie-nouvelle', 'categorie'] : ['rang']
      if (filter && first.base.category !== filter) setFilter('')
      focusAfterRender(...field.map((name) => fieldId(first.id, name)))
      return
    }
    // L'usage a pu changer depuis l'ouverture de l'écran (emplacements) : on revérifie avant de masquer.
    const refused = dirtyEntries
      .filter((entry) => entry.base.visible && !entry.form.visible)
      .map((entry) => ({ entry, reason: photoChangeBlock({ ...usageContext, photoKey: entry.id, action: 'hide' }) }))
      .filter((item) => item.reason)
    if (refused.length > 0) {
      setNotices((current) => ({ ...current, ...Object.fromEntries(refused.map(({ entry, reason }) => [entry.id, reason])) }))
      setSaveError(refused.length === 1 ? 'Enregistrement impossible : 1 photo ne peut pas être masquée.' : `Enregistrement impossible : ${refused.length} photos ne peuvent pas être masquées.`)
      if (filter && refused[0].entry.base.category !== filter) setFilter('')
      focusAfterRender(fieldId(refused[0].entry.id, 'visible'))
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      for (const entry of dirtyEntries) {
        try {
          const stored = await savePhotoMeta(entry.id, photoMetaFromForm(entry.form))
          setEntries((list) => list.map((candidate) => (candidate.id === entry.id ? toEntry(stored) : candidate)))
        } catch (error) {
          throw new Error(`Photo « ${entry.form.alt.trim() || entry.id} » : ${error.message}`)
        }
      }
      setSavedAt(new Date())
      setAttempted(false)
      setTouched({})
      setNotices({})
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const onCancelAll = () => {
    setEntries((list) => list.map(toEntryFromBase))
    setTouched({})
    setAttempted(false)
    setSaveError(null)
    setNotices({})
  }

  return (
    <>
      <UploadForm
        categories={categories}
        existingKeys={entries.map((entry) => entry.id)}
        announce={announce}
        onBusyChange={setUploading}
        onUploaded={(photo) => {
          setEntries((list) => [toEntry(photo), ...list])
          if (filter && filter !== photo.category) setFilter('')
        }}
      />

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="photos-filtre" className="field-label">
            Catégorie
          </label>
          <select id="photos-filtre" className="input-field" value={filter} onChange={(event) => setFilter(event.target.value)} disabled={saving}>
            <option value="">Toutes les catégories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <p role="status" className="pb-3 text-sm font-semibold text-slate-700">
          {count(shown.length, 'photo', 'photos')}
          {filter ? ` dans « ${filter} »` : ''}
        </p>
      </div>

      <div role="alert">{actionError && <p className="mt-4 text-sm font-semibold text-red-800">{actionError}</p>}</div>
      <div role="status">{warning && <p className="mt-4 text-sm font-semibold text-amber-900">{warning}</p>}</div>

      {entries.length === 0 ? (
        <p role="status" className="card-surface mt-6 text-slate-700">
          La bibliothèque est vide : ajoutez une première photo ci-dessus.
        </p>
      ) : shown.length === 0 ? (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Aucune photo dans cette catégorie.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4" aria-label="Photos">
          {shown.map((entry) => {
            const usage = photoUsages({ ...usageContext, photoKey: entry.id })
            const fixed = usageContext.fixedKeys.filter((item) => item.photoKey === entry.id).map((item) => item.where).join(', ')
            return (
              <li key={entry.id} className="card-surface">
                <PhotoCard
                  entry={entry}
                  categories={categories}
                  disabled={saving}
                  busy={busyId === entry.id}
                  errors={errorsOf(entry)}
                  show={(field) => showErrors(entry.id, field)}
                  usage={usage}
                  fixed={fixed}
                  notice={notices[entry.id]}
                  confirming={confirming === entry.id}
                  onChange={(field, value) => {
                    update(entry.id, { [field]: value })
                  }}
                  onBlur={(field) => setTouched((current) => ({ ...current, [`${entry.id}:${field}`]: true }))}
                  onToggleVisible={() => onToggleVisible(entry)}
                  onAsk={() => setConfirming(entry.id)}
                  onCancel={() => setConfirming(null)}
                  onConfirm={() => removeEntry(entry)}
                />
              </li>
            )
          })}
        </ul>
      )}

      <SaveBar dirty={dirty} saving={saving} error={saveError} savedAt={savedAt} onSave={onSave} onCancel={onCancelAll} />
    </>
  )
}

/** Emplacements : photo de chaque emplacement nommé du site (surcharge ou photo par défaut). */
function SlotsPanel({ entries, slots, setSlots, announce }) {
  const [picking, setPicking] = useState(null)
  const [pending, setPending] = useState({})
  const [error, setError] = useState(null)
  const [focusTick, setFocusTick] = useState(0)
  const focusTarget = useRef(null)

  const byKey = useMemo(() => new Map(entries.map((entry) => [entry.id, entry.base])), [entries])
  const visiblePhotos = useMemo(() => entries.filter((entry) => entry.base.visible).map((entry) => entry.base), [entries])
  const groups = useMemo(() => {
    const result = []
    for (const slot of photoSlots) {
      let group = result.find((candidate) => candidate.page === slot.page)
      if (!group) {
        group = { page: slot.page, slots: [] }
        result.push(group)
      }
      group.slots.push(slot)
    }
    return result
  }, [])

  useEffect(() => {
    if (focusTick === 0 || !focusTarget.current) return
    const target = document.getElementById(focusTarget.current)
    focusTarget.current = null
    target?.focus()
  }, [focusTick])
  const focusChange = (slot) => {
    focusTarget.current = `emplacement-${slot.key}-changer`
    setFocusTick((n) => n + 1)
  }

  // Écriture immédiate : l'écran change tout de suite, et revient en arrière avec un message si l'enregistrement échoue.
  const write = async (slot, next, request, done) => {
    const had = hasOwn(slots, slot.key)
    const previous = slots[slot.key]
    setError(null)
    setPending((current) => ({ ...current, [slot.key]: true }))
    setSlots((current) => {
      const copy = { ...current }
      if (next === null) delete copy[slot.key]
      else copy[slot.key] = next
      return copy
    })
    setPicking(null)
    try {
      await request()
      announce(done)
    } catch (failure) {
      setSlots((current) => {
        const copy = { ...current }
        if (had) copy[slot.key] = previous
        else delete copy[slot.key]
        return copy
      })
      setError(`« ${slot.label} » : ${failure.message} L’emplacement a retrouvé sa photo précédente.`)
    } finally {
      setPending((current) => ({ ...current, [slot.key]: false }))
      focusChange(slot) // le bouton est de nouveau actif : le focus y revient
    }
  }

  const choose = (slot, photoKey) => {
    const photo = byKey.get(photoKey)
    return write(slot, photoKey, () => setPhotoSlot(slot.key, photoKey), `Photo de « ${slot.label} » : ${photo?.alt ?? photoKey}.`)
  }
  const reset = (slot) => write(slot, null, () => clearPhotoSlot(slot.key), `Photo par défaut rétablie pour « ${slot.label} ».`)

  return (
    <>
      <div role="alert">{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-900 ring-1 ring-red-200">{error}</p>}</div>
      <div className="mt-6 grid gap-8">
        {groups.map((group) => (
          <section key={group.page} aria-labelledby={`emplacements-${group.page.replace(/\W+/g, '-')}`}>
            <h3 id={`emplacements-${group.page.replace(/\W+/g, '-')}`} className="text-xl">
              {group.page}
            </h3>
            <ul className="mt-3 grid gap-3">
              {group.slots.map((slot) => {
                const { photoKey, overridden } = effectiveSlotPhoto(slot, slots)
                const photo = byKey.get(photoKey)
                const busy = Boolean(pending[slot.key])
                return (
                  <li key={slot.key} className="card-surface !p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {photo ? <PhotoThumb photo={photo} /> : <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-semibold text-slate-700">Introuvable</span>}
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="font-semibold text-[#2B211B]">{slot.label}</p>
                        <p className="text-sm text-slate-700">
                          {photo ? photo.alt : `Photo introuvable (${photoKey}) : le site utilise une photo de secours.`}
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {overridden ? 'Photo choisie' : 'Photo par défaut'}
                          {photo && !photo.visible && ' · masquée sur le site : une photo de secours est utilisée'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          id={`emplacement-${slot.key}-changer`}
                          aria-expanded={picking === slot.key}
                          onClick={() => setPicking(picking === slot.key ? null : slot.key)}
                          disabled={busy}
                          className={`btn-outline touch-target !px-4 !py-2 text-sm ${focusRing}`}
                        >
                          Changer<span className="sr-only"> la photo : « {slot.label} »</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => reset(slot)}
                          disabled={!overridden || busy}
                          className={`touch-target rounded-full px-3 text-sm font-semibold text-[#2B211B] underline underline-offset-2 disabled:opacity-50 ${focusRing}`}
                        >
                          Rétablir le défaut<span className="sr-only"> pour « {slot.label} »</span>
                        </button>
                      </div>
                    </div>
                    {picking === slot.key && (
                      <SlotPicker idPrefix={`choix-${slot.key}`} label={slot.label} photos={visiblePhotos} value={photoKey} disabled={busy} onChoose={(key) => choose(slot, key)} onCancel={() => { setPicking(null); focusChange(slot) }} />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error' } | { status: 'ready' }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  /** @type {[Entry[], Function]} */
  const [entries, setEntries] = useState([])
  const [slots, setSlots] = useState({})
  const [rooms, setRooms] = useState([])
  const [tab, setTab] = useState('bibliotheque')
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([loadPhotos(), loadPhotoSlots(), loadRooms()])
      .then(([photos, overrides, allRooms]) => {
        if (cancelled) return
        setEntries(photos.map(toEntry))
        setSlots(overrides)
        setRooms(allRooms)
        setLoad({ status: 'ready' })
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  const usageContext = useMemo(() => ({ slots, defaults: photoSlots, rooms, fixedKeys: fixedPhotoUsages }), [slots, rooms])

  const onTabKeyDown = (event) => {
    const index = TABS.findIndex((item) => item.id === tab)
    let next = null
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    if (next === null) return
    event.preventDefault()
    setTab(TABS[next].id)
    document.getElementById(`photos-onglet-${TABS[next].id}`)?.focus()
  }

  return (
    <section aria-labelledby="titre-photos" className="pb-40 md:pb-28">
      <h1 id="titre-photos" className="text-2xl sm:text-3xl">
        Photos
      </h1>
      <p className="mt-2 text-slate-700">
        La bibliothèque regroupe toutes les photos du site ; les emplacements choisissent celle qui s’affiche à chaque endroit. Les modifications ne sont visibles qu’après publication.
      </p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement des photos…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger les photos.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && (
        <>
          <div role="tablist" aria-label="Sections des photos" className="mt-6 flex gap-1 border-b border-slate-300" onKeyDown={onTabKeyDown}>
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`photos-onglet-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`photos-panneau-${item.id}`}
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => setTab(item.id)}
                className={`touch-target -mb-px rounded-t-xl border-b-4 px-4 text-base font-semibold ${focusRing} ${tab === item.id ? 'border-[#C2410C] text-[#9A3412]' : 'border-transparent text-slate-700 hover:text-[#9A3412]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="photos-panneau-bibliotheque" aria-labelledby="photos-onglet-bibliotheque" hidden={tab !== 'bibliotheque'} className="mt-6">
            <Library entries={entries} setEntries={setEntries} usageContext={usageContext} announce={setAnnouncement} />
          </div>
          <div role="tabpanel" id="photos-panneau-emplacements" aria-labelledby="photos-onglet-emplacements" hidden={tab !== 'emplacements'} className="mt-6">
            <SlotsPanel entries={entries} slots={slots} setSlots={setSlots} announce={setAnnouncement} />
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </>
      )}
    </section>
  )
}
