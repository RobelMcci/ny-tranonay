import { useEffect, useRef, useState } from 'react'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'
const CONFIRM_DELAY_MS = 400

/**
 * Retrait d'un élément en deux temps, accessible : « Retirer » ouvre une confirmation dont le focus va sur « Annuler »
 * (choix sûr) et dont la question est annoncée ; « Annuler » rend le focus à « Retirer » ; « Confirmer la suppression »
 * est ignoré pendant 400 ms après l'ouverture (double clic ou double toucher accidentel).
 *
 * L'état « en confirmation » appartient au parent (une seule confirmation à la fois). Après une suppression réussie,
 * c'est au parent de placer le focus (l'élément disparaît).
 *
 * @param {{
 *   label: string,
 *   from: string,
 *   confirming: boolean,
 *   busy?: boolean,
 *   onAsk: () => void,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 * }} props `label` = nom de l'élément (pour les lecteurs d'écran), `from` = complément de « Retirer » (« de la liste », « de la FAQ »).
 */
export default function ConfirmRemove({ label, from, confirming, busy = false, onAsk, onCancel, onConfirm }) {
  const [announcement, setAnnouncement] = useState('')
  const askButton = useRef(null)
  const cancelButton = useRef(null)
  const openedAt = useRef(0)
  // Le focus n'est déplacé que pour une action de l'utilisateur sur CE composant, une fois l'écran à jour.
  const pendingFocus = useRef(null)

  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    if (target === 'cancel') cancelButton.current?.focus()
    else askButton.current?.focus()
  }, [confirming])

  // Une suppression qui échoue réactive les boutons : le focus, perdu avec le bouton désactivé, revient sur « Annuler ».
  // Si l'utilisateur a déjà placé le focus ailleurs, on n'y touche pas.
  const wasBusy = useRef(false)
  useEffect(() => {
    const finished = wasBusy.current && !busy
    wasBusy.current = busy
    if (finished && confirming && (document.activeElement === document.body || document.activeElement === null)) cancelButton.current?.focus()
  }, [busy, confirming])

  return (
    <>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {confirming ? (
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
            Annuler<span className="sr-only"> la suppression de « {label} »</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (Date.now() - openedAt.current < CONFIRM_DELAY_MS) return
              onConfirm()
            }}
            disabled={busy}
            className={`touch-target rounded-full bg-red-800 px-4 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-60 ${focusRing}`}
          >
            Confirmer la suppression<span className="sr-only"> de « {label} »</span>
          </button>
        </span>
      ) : (
        <button
          type="button"
          ref={askButton}
          onClick={() => {
            openedAt.current = Date.now()
            pendingFocus.current = 'cancel'
            setAnnouncement(`Confirmer la suppression de « ${label} » ?`)
            onAsk()
          }}
          disabled={busy}
          className={`touch-target rounded-full px-3 text-sm font-semibold text-red-800 underline underline-offset-2 disabled:opacity-60 ${focusRing}`}
        >
          Retirer<span className="sr-only"> « {label} » {from}</span>
        </button>
      )}
    </>
  )
}
