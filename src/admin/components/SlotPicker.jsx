import { useEffect, useMemo, useRef, useState } from 'react'
import { categoriesOf } from '../photos-map.js'
import PhotoThumb from './PhotoThumb.jsx'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

/**
 * Choix de la photo d'un emplacement : groupe de boutons radio (flèches du clavier pour parcourir, rien n'est écrit tant
 * que « Choisir cette photo » n'est pas activé), filtrable par catégorie. Échap ou « Annuler » ferme sans rien changer.
 *
 * @param {{
 *   idPrefix: string,
 *   label: string,
 *   photos: import('../photos-map.js').Photo[],
 *   value: string,
 *   disabled?: boolean,
 *   onChoose: (photoKey: string) => void,
 *   onCancel: () => void,
 * }} props `photos` = photos proposées (visibles), `value` = photo actuelle de l'emplacement, `label` = nom de l'emplacement.
 */
export default function SlotPicker({ idPrefix, label, photos, value, disabled = false, onChoose, onCancel }) {
  const [selected, setSelected] = useState(photos.some((photo) => photo.key === value) ? value : null)
  const [category, setCategory] = useState('')
  const group = useRef(null)
  const categories = useMemo(() => categoriesOf(photos), [photos])
  const shown = category ? photos.filter((photo) => photo.category === category) : photos

  // À l'ouverture, le focus va sur la photo actuelle (ou la première) pour parcourir au clavier.
  useEffect(() => {
    const target = group.current?.querySelector('input[type="radio"]:checked') ?? group.current?.querySelector('input[type="radio"]')
    target?.focus()
  }, [])

  return (
    <div
      role="group"
      aria-label={`Choisir la photo : ${label}`}
      className="mt-3 rounded-2xl border border-slate-300 bg-white p-3"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onCancel()
        }
      }}
    >
      {photos.length === 0 ? (
        <p role="status" className="text-sm text-slate-700">
          Aucune photo visible n’est disponible. Ajoutez ou affichez une photo dans la bibliothèque.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor={`${idPrefix}-categorie`} className="field-label">
                Catégorie
              </label>
              <select id={`${idPrefix}-categorie`} className="input-field" value={category} onChange={(event) => setCategory(event.target.value)} disabled={disabled}>
                <option value="">Toutes les catégories</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <p role="status" className="pb-2 text-sm text-slate-700">
              {shown.length === 1 ? '1 photo' : `${shown.length} photos`}
            </p>
          </div>
          <fieldset ref={group} disabled={disabled} className="mt-3 min-w-0">
            <legend className="sr-only">Photos proposées</legend>
            {shown.length === 0 ? (
              <p className="text-sm text-slate-700">Aucune photo dans cette catégorie.</p>
            ) : (
              <ul className="grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2">
                {shown.map((photo) => {
                  const id = `${idPrefix}-${photo.key}`
                  return (
                    <li key={photo.key}>
                      <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 has-[:checked]:bg-orange-50 has-[:checked]:ring-2 has-[:checked]:ring-[#C2410C] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#C2410C]">
                        <input
                          type="radio"
                          id={id}
                          name={`${idPrefix}-photo`}
                          value={photo.key}
                          checked={selected === photo.key}
                          onChange={() => setSelected(photo.key)}
                          className="h-5 w-5 shrink-0 accent-[#C2410C]"
                        />
                        <PhotoThumb photo={photo} />
                        <span className="min-w-0 text-sm">
                          <span className="block break-words font-semibold text-[#2B211B]">{photo.alt}</span>
                          <span className="block text-slate-700">{photo.category}</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </fieldset>
        </>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selected && onChoose(selected)}
          disabled={disabled || !selected || selected === value}
          className={`btn-primary touch-target ${focusRing}`}
        >
          Choisir cette photo<span className="sr-only"> pour « {label} »</span>
        </button>
        <button type="button" onClick={onCancel} disabled={disabled} className={`touch-target rounded-full px-4 text-sm font-semibold text-[#2B211B] underline underline-offset-2 disabled:opacity-50 ${focusRing}`}>
          Annuler<span className="sr-only"> le choix de la photo pour « {label} »</span>
        </button>
      </div>
    </div>
  )
}
