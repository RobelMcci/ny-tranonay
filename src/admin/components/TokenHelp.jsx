import { useId, useState } from 'react'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

const DESCRIPTIONS = {
  chambre_min: 'Prix mini d’une chambre',
  chambre_max: 'Prix maxi d’une chambre',
  tel: 'Numéro de téléphone',
  email: 'Adresse e-mail',
  horaires: 'Horaires d’ouverture',
  checkin: 'Heure d’arrivée en chambre',
  checkout: 'Heure de départ de la chambre',
  'prix.reception_max_invites': 'Nombre maximum d’invités',
}

function describe(name) {
  if (Object.hasOwn(DESCRIPTIONS, name)) return DESCRIPTIONS[name]
  if (name.startsWith('prix.')) return 'Tarif en Ar'
  return 'Variable du site'
}

/**
 * Panneau repliable « Insérer une variable » : une variable `{{nom}}` est remplacée sur le site par sa valeur actuelle.
 * Le parent reçoit le texte à insérer (`{{nom}}`) et le place à la position du curseur du champ concerné.
 *
 * @param {{ vars: Record<string, string>, onInsert: (token: string) => void, disabled?: boolean }} props
 */
export default function TokenHelp({ vars, onInsert, disabled = false }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const names = Object.keys(vars)

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={`touch-target inline-flex items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#9A3412] underline underline-offset-2 disabled:opacity-60 ${focusRing}`}
      >
        <span aria-hidden="true">{open ? '−' : '+'}</span>
        Insérer une variable
      </button>
      <div id={panelId} hidden={!open} className="mt-1 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
        <p className="text-sm text-slate-700">
          Une variable est remplacée sur le site par sa valeur actuelle. Elle est insérée à l’endroit du curseur du champ où vous écriviez.
        </p>
        {names.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">Aucune variable n’est disponible.</p>
        ) : (
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {names.map((name) => {
              const value = typeof vars[name] === 'string' ? vars[name] : null
              return (
                <li key={name} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1 ring-1 ring-black/5">
                  <span className="min-w-0 text-sm">
                    <code className="break-all font-semibold text-[#2B211B]">{`{{${name}}}`}</code>
                    <span className="block text-slate-700">
                      {describe(name)}
                      {value ? ` : ${value}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onInsert(`{{${name}}}`)}
                    className={`touch-target shrink-0 rounded-full border border-[#C2410C] px-3 text-sm font-semibold text-[#9A3412] hover:bg-[#C2410C] hover:text-white disabled:opacity-60 ${focusRing}`}
                  >
                    Insérer<span className="sr-only"> {`{{${name}}}`}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Avertissement sur les variables de texte : en cours de chargement, indisponibles, ou incomplètes.
 * N'affiche rien quand tout est chargé.
 * @param {{ state: { status: 'loading' | 'ready' | 'error', complete: boolean }, onRetry: () => void }} props
 */
export function VarsNotice({ state, onRetry }) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="mt-4 text-sm text-slate-700">
        Chargement des variables du site…
      </p>
    )
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">
        <p className="font-semibold">Les variables du site n’ont pas pu être chargées.</p>
        <p className="mt-1">Vous pouvez enregistrer des textes sans variable {'{{…}}'} ; les autres ne peuvent pas être vérifiés.</p>
        <button type="button" onClick={onRetry} className={`touch-target mt-2 rounded-full px-2 font-semibold underline underline-offset-2 ${focusRing}`}>
          Réessayer
        </button>
      </div>
    )
  }
  if (!state.complete) {
    return (
      <p role="status" className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">
        Les informations générales ne sont pas encore enregistrées : les variables {'{{tel}}'}, {'{{email}}'}, {'{{horaires}}'}, {'{{checkin}}'} et {'{{checkout}}'} ne sont pas disponibles.
      </p>
    )
  }
  return null
}
