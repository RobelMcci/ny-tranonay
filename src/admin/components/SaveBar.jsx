const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/**
 * Barre d'enregistrement fixée en bas de l'écran (au-dessus de la navigation mobile,
 * à droite de la barre latérale sur ordinateur).
 *
 * @param {{ dirty: boolean, saving: boolean, error?: string | null, savedAt?: Date | number | null,
 *           onSave: () => void, onCancel?: () => void }} props
 */
export default function SaveBar({ dirty, saving, error, savedAt, onSave, onCancel }) {
  let status = ''
  if (saving) status = 'Enregistrement…'
  else if (dirty) status = 'Modifications non enregistrées'
  else if (savedAt) status = `Enregistré à ${timeFormat.format(savedAt)}`

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-black/10 bg-white/95 backdrop-blur md:bottom-0 md:left-60">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1 basis-48">
          {/* Régions vives toujours présentes pour que les changements soient annoncés. */}
          <p role="status" className={`text-sm font-semibold ${dirty ? 'text-amber-900' : 'text-slate-700'}`}>
            {status}
          </p>
          <div role="alert">
            {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={!dirty || saving}
            className={`touch-target rounded-full px-4 text-sm font-semibold text-[#2B211B] underline underline-offset-2 disabled:opacity-50 ${focusRing}`}
          >
            Annuler
          </button>
        )}
        <button type="button" onClick={onSave} disabled={!dirty || saving} className={`btn-primary touch-target ${focusRing}`}>
          Enregistrer
        </button>
      </div>
    </div>
  )
}
