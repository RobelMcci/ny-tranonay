import { useCallback, useEffect, useRef, useState } from 'react'
import { loadPhotoChoices, loadRooms, saveRoom, saveRoomOrder } from '../api.js'
import Field from '../components/Field.jsx'
import OrderableList from '../components/OrderableList.jsx'
import SaveBar from '../components/SaveBar.jsx'
import { formFromRoom, formatPrice, roomFromForm, slugify, validateRoom } from '../rooms-map.js'
import { useUnsavedWarning } from '../useUnsavedWarning.js'
import { parseAmount } from '../validation.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

const FIELD_ORDER = ['name', 'price', 'features', 'quantity']
const fieldId = (entryId, field) => `chambre-${entryId}-${field}`

/**
 * Une chambre du formulaire : `id` = clé stable de la liste (identifiant de la chambre, ou clé provisoire tant qu'elle n'est pas enregistrée),
 * `base` = chambre enregistrée (`null` si nouvelle), `form` = saisie en cours.
 * @typedef {{ id: string, position: number, base: import('../rooms-map.js').Room | null, form: ReturnType<typeof formFromRoom> }} Entry
 */

const toEntry = (room) => ({ id: room.id, position: room.position, base: room, form: formFromRoom(room) })

const errorsOf = (entry) => validateRoom(entry.form)

/** Modifiée : nouvelle, invalide (à corriger) ou différente de la version enregistrée. */
function isDirty(entry) {
  if (!entry.base) return true
  if (Object.keys(errorsOf(entry)).length > 0) return true
  const room = roomFromForm(entry.form)
  const { base } = entry
  return (
    room.name !== base.name ||
    room.price !== base.price ||
    room.quantity !== base.quantity ||
    room.visible !== base.visible ||
    room.features.join('\n') !== base.features.join('\n') ||
    room.photoKeys.join('\n') !== base.photoKeys.join('\n')
  )
}

function PhotoChoices({ entry, photos, disabled, onToggle, onRetry }) {
  const selected = entry.form.photoKeys
  const known = new Set(photos.items.map((photo) => photo.key))
  const missing = selected.filter((key) => !known.has(key))
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="field-label">Photos</legend>
      {photos.status === 'loading' && <p className="text-sm text-slate-700">Chargement des photos…</p>}
      {photos.status === 'error' && (
        <div role="alert" className="text-sm text-red-900">
          <p className="font-semibold">Impossible de charger les photos.</p>
          <button type="button" onClick={onRetry} className={`touch-target mt-1 rounded-full px-2 font-semibold underline underline-offset-2 ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}
      {photos.status === 'ready' && photos.items.length === 0 && missing.length === 0 && (
        <p className="text-sm text-slate-700">Aucune photo n’est disponible pour le moment.</p>
      )}
      {(photos.status === 'ready' || missing.length > 0) && (photos.items.length > 0 || missing.length > 0) && (
        <ul className="grid max-h-72 gap-1 overflow-y-auto rounded-xl border border-slate-300 bg-white p-2">
          {missing.map((key) => (
            <li key={key}>
              <label className="touch-target flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#C2410C]" checked onChange={() => onToggle(key)} />
                <span>
                  <span className="font-semibold text-red-900">Photo introuvable</span>
                  <span className="text-slate-700"> ({key}) : décochez-la pour la retirer.</span>
                </span>
              </label>
            </li>
          ))}
          {photos.items.map((photo) => (
            <li key={photo.key}>
              <label className="touch-target flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#C2410C]"
                  checked={selected.includes(photo.key)}
                  onChange={() => onToggle(photo.key)}
                />
                <span>
                  <span className="text-[#2B211B]">{photo.alt}</span>
                  <span className="text-slate-700">
                    {' '}
                    — {photo.category}
                    {photo.visible === false ? ' (masquée sur le site)' : ''}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}

function RoomCard({ entry, open, onToggleOpen, disabled, photos, showErrors, onChange, onBlurField, onToggleVisible, onTogglePhoto, onRetryPhotos, onBlurPrice }) {
  const errors = errorsOf(entry)
  const shown = (field) => (showErrors(entry.id, field) ? errors[field] : undefined)
  const panelId = `chambre-${entry.id}-panneau`
  const name = entry.form.name.trim() || 'Nouvelle chambre'
  const price = parseAmount(entry.form.price)
  const dirty = isDirty(entry)

  return (
    <div>
      <button
        type="button"
        id={`chambre-${entry.id}-titre`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggleOpen}
        className={`touch-target flex w-full items-center justify-between gap-3 rounded-xl px-1 text-left ${focusRing}`}
      >
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold text-[#2B211B]">{name}</span>
          <span className="block text-sm text-slate-700">
            {price.ok ? `${formatPrice(price.value)} Ar par nuit` : 'Prix à corriger'}
            {!entry.form.visible && ' · Masquée sur le site'}
            {dirty && ' · Non enregistrée'}
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-lg text-slate-700">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <fieldset id={panelId} disabled={disabled} aria-labelledby={`chambre-${entry.id}-titre`} className="mt-4 grid min-w-0 gap-5 border-t border-black/10 pt-4">
          <p className="text-sm text-slate-700">
            Identifiant : {entry.base ? <code>{entry.base.id}</code> : 'créé à partir du nom, au premier enregistrement'}
            {entry.base && ' (non modifiable)'}
          </p>

          <Field id={fieldId(entry.id, 'name')} label="Nom de la chambre" error={shown('name')}>
            <input type="text" autoComplete="off" className="input-field" value={entry.form.name} onChange={onChange('name')} onBlur={onBlurField('name')} />
          </Field>

          <Field id={fieldId(entry.id, 'price')} label="Prix par nuit (Ar)" error={shown('price')}>
            <input type="text" inputMode="numeric" autoComplete="off" className="input-field max-w-xs" value={entry.form.price} onChange={onChange('price')} onBlur={onBlurPrice} />
          </Field>

          <Field id={fieldId(entry.id, 'features')} label="Équipements" hint="Un équipement par ligne, 20 au maximum." error={shown('features')}>
            <textarea rows={6} className="input-field" value={entry.form.features} onChange={onChange('features')} onBlur={onBlurField('features')} />
          </Field>

          <Field id={fieldId(entry.id, 'quantity')} label="Nombre de chambres de ce type" error={shown('quantity')}>
            <input type="text" inputMode="numeric" autoComplete="off" className="input-field max-w-[8rem]" value={entry.form.quantity} onChange={onChange('quantity')} onBlur={onBlurField('quantity')} />
          </Field>

          <PhotoChoices entry={entry} photos={photos} disabled={disabled} onToggle={onTogglePhoto} onRetry={onRetryPhotos} />

          <label className="touch-target flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#2B211B]">
            <input type="checkbox" role="switch" className="h-6 w-11 shrink-0 accent-[#C2410C]" checked={entry.form.visible} onChange={onToggleVisible} />
            Visible sur le site
          </label>
        </fieldset>
      )}
    </div>
  )
}

export function Component() {
  // `load` : { status: 'loading' } | { status: 'error' } | { status: 'ready' }
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [photoAttempt, setPhotoAttempt] = useState(0)
  const [photos, setPhotos] = useState({ status: 'loading', items: [] })
  /** @type {[Entry[], Function]} */
  const [entries, setEntries] = useState([])
  const [openIds, setOpenIds] = useState({})
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const [order, setOrder] = useState({ status: 'idle', message: '' })
  const [announcement, setAnnouncement] = useState('')
  const [focusTick, setFocusTick] = useState(0)

  const focusTarget = useRef(null)
  const confirmedOrder = useRef([])
  const orderQueue = useRef(Promise.resolve())
  const orderToken = useRef(0)
  const newCount = useRef(0)

  useEffect(() => {
    let cancelled = false
    loadRooms()
      .then((rooms) => {
        if (cancelled) return
        const loaded = rooms.map(toEntry)
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

  useEffect(() => {
    let cancelled = false
    loadPhotoChoices()
      .then((items) => {
        if (!cancelled) setPhotos({ status: 'ready', items })
      })
      .catch(() => {
        if (!cancelled) setPhotos({ status: 'error', items: [] })
      })
    return () => {
      cancelled = true
    }
  }, [photoAttempt])

  // Le focus est déplacé une fois les erreurs et les panneaux affichés.
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

  const retryPhotos = useCallback(() => {
    setPhotos({ status: 'loading', items: [] })
    setPhotoAttempt((n) => n + 1)
  }, [])

  const dirtyEntries = load.status === 'ready' ? entries.filter(isDirty) : []
  const dirty = dirtyEntries.length > 0
  const hasNew = entries.some((entry) => !entry.base)
  useUnsavedWarning(dirty)

  const visibleCount = entries.filter((entry) => entry.base?.visible).length

  const update = (id, change) => {
    setEntries((list) => list.map((entry) => (entry.id === id ? { ...entry, form: { ...entry.form, ...change(entry.form) } } : entry)))
    setSaveError(null)
  }
  const onChange = (id, field) => (event) => {
    const { value } = event.target
    update(id, () => ({ [field]: value }))
  }
  const onBlurField = (id, field) => () => setTouched((t) => ({ ...t, [`${id}:${field}`]: true }))
  const onBlurPrice = (id) => () => {
    onBlurField(id, 'price')()
    const entry = entries.find((candidate) => candidate.id === id)
    const parsed = entry ? parseAmount(entry.form.price) : null
    if (parsed?.ok) update(id, () => ({ price: formatPrice(parsed.value) }))
  }
  const showErrors = (id, field) => attempted || Boolean(touched[`${id}:${field}`])

  const toggleOpen = (id) => setOpenIds((open) => ({ ...open, [id]: !open[id] }))

  const onTogglePhoto = (id) => (key) =>
    update(id, (form) => ({ photoKeys: form.photoKeys.includes(key) ? form.photoKeys.filter((k) => k !== key) : [...form.photoKeys, key] }))

  const addRoom = () => {
    newCount.current += 1
    const id = `__nouvelle-${newCount.current}`
    const position = entries.length > 0 ? Math.max(...entries.map((entry) => entry.position)) + 1 : 0
    const room = { id, name: '', price: 0, features: [], photoKeys: [], quantity: 1, position, visible: true }
    const form = { ...formFromRoom(room), price: '' }
    setEntries((list) => [...list, { id, position, base: null, form }])
    setOpenIds((open) => ({ ...open, [id]: true }))
    setSaveError(null)
    setAnnouncement('Nouvelle chambre ajoutée à la fin de la liste.')
    focusTarget.current = fieldId(id, 'name')
    setFocusTick((n) => n + 1)
  }

  // Réordonner : affichage immédiat, enregistrement en file ; retour à l'ordre confirmé en cas d'échec.
  const onReorder = (next) => {
    const ordered = next.map((entry, position) => ({ ...entry, position }))
    setEntries(ordered)
    const ids = ordered.map((entry) => entry.base.id)
    orderToken.current += 1
    const token = orderToken.current
    setOrder({ status: 'saving', message: 'Enregistrement de l’ordre…' })
    orderQueue.current = orderQueue.current.then(async () => {
      try {
        await saveRoomOrder(ids)
        confirmedOrder.current = ordered.map((entry) => entry.id)
        if (token === orderToken.current) setOrder({ status: 'saved', message: 'Ordre enregistré.' })
      } catch (error) {
        if (token !== orderToken.current) return
        const rank = new Map(confirmedOrder.current.map((id, index) => [id, index]))
        setEntries((list) => [...list].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)).map((entry, position) => ({ ...entry, position })))
        setOrder({ status: 'error', message: `${error.message} L’ordre précédent a été rétabli.` })
      }
    })
  }

  const onSave = async () => {
    setAttempted(true)
    const invalid = dirtyEntries.filter((entry) => Object.keys(errorsOf(entry)).length > 0)
    if (invalid.length > 0) {
      setSaveError(
        invalid.length === 1 ? 'Enregistrement impossible : 1 chambre est à corriger.' : `Enregistrement impossible : ${invalid.length} chambres sont à corriger.`,
      )
      setOpenIds((open) => ({ ...open, ...Object.fromEntries(invalid.map((entry) => [entry.id, true])) }))
      const first = invalid[0]
      const firstField = FIELD_ORDER.find((field) => errorsOf(first)[field])
      focusTarget.current = fieldId(first.id, firstField)
      setFocusTick((n) => n + 1)
      return
    }
    setSaving(true)
    setSaveError(null)
    const usedIds = entries.flatMap((entry) => (entry.base ? [entry.base.id] : []))
    try {
      for (const entry of dirtyEntries) {
        const id = entry.base?.id ?? slugify(entry.form.name, usedIds)
        const room = { ...roomFromForm({ ...entry.form, id }), position: entry.position }
        await saveRoom(room)
        usedIds.push(id)
        setEntries((list) => list.map((candidate) => (candidate.id === entry.id ? { ...candidate, base: room, form: formFromRoom(room) } : candidate)))
        if (!entry.base) confirmedOrder.current = [...confirmedOrder.current, entry.id]
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
    setEntries((list) => list.filter((entry) => entry.base).map((entry) => ({ ...entry, form: formFromRoom(entry.base) })))
    setTouched({})
    setAttempted(false)
    setSaveError(null)
  }

  const renderItem = (entry) => (
    <RoomCard
      entry={entry}
      open={Boolean(openIds[entry.id])}
      onToggleOpen={() => toggleOpen(entry.id)}
      disabled={saving}
      photos={photos}
      showErrors={showErrors}
      onChange={(field) => onChange(entry.id, field)}
      onBlurField={(field) => onBlurField(entry.id, field)}
      onToggleVisible={() => update(entry.id, (form) => ({ visible: !form.visible }))}
      onTogglePhoto={onTogglePhoto(entry.id)}
      onRetryPhotos={retryPhotos}
      onBlurPrice={onBlurPrice(entry.id)}
    />
  )

  return (
    <section aria-labelledby="titre-chambres" className="pb-40 md:pb-28">
      <h1 id="titre-chambres" className="text-2xl sm:text-3xl">
        Chambres
      </h1>
      <p className="mt-2 text-slate-700">
        Les chambres proposées sur le site. Les modifications ne sont visibles qu’après publication. Une chambre ne se supprime pas : masquez-la pour la retirer du site.
      </p>

      {load.status === 'loading' && (
        <p role="status" className="card-surface mt-6 text-slate-700">
          Chargement des chambres…
        </p>
      )}

      {load.status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-red-900 ring-1 ring-red-200">
          <p className="font-semibold">Impossible de charger les chambres.</p>
          <p className="mt-1 text-sm">Vérifiez votre connexion internet puis réessayez.</p>
          <button type="button" onClick={retry} className={`btn-primary mt-4 touch-target ${focusRing}`}>
            Réessayer
          </button>
        </div>
      )}

      {load.status === 'ready' && (
        <>
          {visibleCount === 0 && (
            <p role="status" className="mt-6 rounded-2xl bg-slate-100 p-4 text-slate-800 ring-1 ring-slate-200">
              Aucune chambre n’est visible : la section chambres du site sera vide.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={addRoom} disabled={saving} className={`btn-outline touch-target ${focusRing}`}>
              Ajouter une chambre
            </button>
            {hasNew && <p className="text-sm text-slate-700">Enregistrez la nouvelle chambre avant de modifier l’ordre.</p>}
          </div>

          <div className="mt-6">
            {entries.length > 0 && (
              <OrderableList
                label="Chambres"
                items={entries}
                getLabel={(entry) => entry.form.name.trim() || 'Nouvelle chambre'}
                disabled={hasNew || saving}
                onReorder={onReorder}
                renderItem={renderItem}
              />
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
