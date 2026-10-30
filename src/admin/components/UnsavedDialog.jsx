import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { nextFocusIndex } from '../unsaved.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'

/**
 * Confirmation « Quitter sans enregistrer ? » affichée quand `blocker` (useBlocker de React Router) retient une navigation.
 * Accessible : dialogue modal natif (le reste de la page est inerte), titre et texte reliés, focus sur le bouton sûr
 * « Rester sur la page », Échap = rester, Tab piégé entre les deux boutons, focus rendu à l'élément d'origine si l'on reste.
 * Rendu dans `document.body` (portail) : il reste visible même si l'écran qui l'appelle est dans un onglet masqué.
 * @param {{ blocker: import('react-router-dom').Blocker }} props
 */
export default function UnsavedDialog({ blocker }) {
  const open = blocker.state === 'blocked'
  const dialogRef = useRef(null)
  const stayRef = useRef(null)
  const leaveRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const dialog = dialogRef.current
    returnFocusRef.current = document.activeElement
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    stayRef.current?.focus()
    return () => {
      if (dialog?.open && typeof dialog.close === 'function') dialog.close()
    }
  }, [open])

  if (!open) return null

  const stay = () => {
    const target = returnFocusRef.current
    blocker.reset?.()
    // Après la fermeture du dialogue : on rend le focus à l'élément qui l'avait (lien du menu, bouton…).
    setTimeout(() => {
      if (target && target !== document.body && target.isConnected && typeof target.focus === 'function') target.focus()
    }, 0)
  }
  const leave = () => blocker.proceed?.()

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      stay()
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      const buttons = [stayRef.current, leaveRef.current]
      buttons[nextFocusIndex(buttons.indexOf(document.activeElement), buttons.length, event.shiftKey)]?.focus()
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="quitter-titre"
      aria-describedby="quitter-texte"
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        event.preventDefault()
        stay()
      }}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-white p-6 text-[#2B211B] shadow-xl backdrop:bg-black/50"
    >
      <h2 id="quitter-titre" className="text-xl">
        Quitter sans enregistrer ?
      </h2>
      <p id="quitter-texte" className="mt-2 text-slate-800">
        Les modifications de cet écran ne sont pas enregistrées. Si vous quittez la page maintenant, elles seront perdues.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          ref={leaveRef}
          type="button"
          onClick={leave}
          className={`touch-target rounded-full px-4 font-semibold text-red-900 underline underline-offset-2 hover:bg-red-50 ${focusRing}`}
        >
          Quitter sans enregistrer
        </button>
        <button ref={stayRef} type="button" onClick={stay} className={`btn-primary touch-target ${focusRing}`}>
          Rester sur la page
        </button>
      </div>
    </dialog>,
    document.body,
  )
}
