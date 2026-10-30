import { useEffect, useId, useRef, useState } from 'react'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'
const CONFIRM_DELAY_MS = 400

/**
 * Retour à une ancienne version en deux temps, accessible (même principe que `ConfirmRemove`) :
 * « Revenir à cette version » ouvre une confirmation dont le focus va sur « Annuler » (choix sûr) et dont la question est
 * annoncée ; « Annuler » rend le focus au bouton d'ouverture ; « Confirmer le retour » est ignoré pendant 400 ms après
 * l'ouverture (double clic ou double toucher accidentel). La confirmation explique qu'une NOUVELLE version est créée.
 *
 * L'état « en confirmation » appartient au parent (une seule confirmation à la fois). Après un retour réussi,
 * c'est au parent de placer le focus (la liste change).
 *
 * @param {{
 *   label: string,
 *   confirming: boolean,
 *   busy?: boolean,
 *   onAsk: () => void,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 * }} props `label` = description de la version (date), pour les lecteurs d'écran.
 */
export default function ConfirmRestore({ label, confirming, busy = false, onAsk, onCancel, onConfirm }) {
  const [announcement, setAnnouncement] = useState('')
  const helpId = useId()
  const askButton = useRef(null)
  const cancelButton = useRef(null)
  const openedAt = useRef(0)
  const pendingFocus = useRef(null)

  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    if (target === 'cancel') cancelButton.current?.focus()
    else askButton.current?.focus()
  }, [confirming])

  // Un retour qui échoue réactive les boutons : le focus, perdu avec le bouton désactivé, revient sur « Annuler ».
  const wasBusy = useRef(false)
  useEffect(() => {
    const finished = wasBusy.current && !busy
    wasBusy.current = busy
    if (finished && confirming && (document.activeElement === document.body || document.activeElement === null)) cancelButton.current?.focus()
  }, [busy, confirming])

  const explanation = 'Une nouvelle version sera créée à partir de celle-ci, puis publiée. Rien n’est effacé : les autres versions restent dans l’historique. Vos écrans de modification gardent leurs valeurs actuelles : le prochain « Publier » les remettra en ligne par-dessus cette version.'

  return (
    <>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {confirming ? (
        <div className="grid gap-3">
          <p id={helpId} className="text-sm text-slate-800">
            {explanation}
          </p>
          <span className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              ref={cancelButton}
              onClick={() => {
                pendingFocus.current = 'ask'
                setAnnouncement('')
                onCancel()
              }}
              disabled={busy}
              className={`touch-target rounded-full border border-slate-400 bg-white px-4 text-sm font-semibold text-[#2B211B] hover:bg-slate-50 ${focusRing}`}
            >
              Annuler<span className="sr-only"> le retour à la version du {label}</span>
            </button>
            <button
              type="button"
              aria-describedby={helpId}
              onClick={() => {
                if (Date.now() - openedAt.current < CONFIRM_DELAY_MS) return
                onConfirm()
              }}
              disabled={busy}
              className={`touch-target rounded-full bg-[#9A3412] px-4 text-sm font-semibold text-white hover:bg-[#7C2D12] disabled:opacity-60 ${focusRing}`}
            >
              {busy ? 'Retour en cours…' : 'Confirmer le retour'}
              <span className="sr-only"> à la version du {label}</span>
            </button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          ref={askButton}
          onClick={() => {
            openedAt.current = Date.now()
            pendingFocus.current = 'cancel'
            setAnnouncement(`Confirmer le retour à la version du ${label} ?`)
            onAsk()
          }}
          disabled={busy}
          className={`touch-target rounded-full px-3 text-sm font-semibold text-[#9A3412] underline underline-offset-2 disabled:opacity-60 ${focusRing}`}
        >
          Revenir à cette version<span className="sr-only"> du {label}</span>
        </button>
      )}
    </>
  )
}
