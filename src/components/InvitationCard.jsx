import { useEffect, useRef, useState } from 'react'
import { SITE_URL, mapsDirectionsUrl } from '../data/site.js'
import { drawInvitation, pickFromSrcSet } from '../lib/invitation.js'
import { photos } from '../lib/images.js'
import { ShareIcon } from './Icons.jsx'

/** Carte d'invitation générée dans le navigateur, partageable sur WhatsApp, Messenger… */
export default function InvitationCard({ eventType, date, defaultHost }) {
  const canvasRef = useRef(null)
  const [host, setHost] = useState(defaultHost || '')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const srcSet = photos.piscine?.srcSet
    if (!srcSet) return undefined // photo « piscine » absente du registre : pas d'invitation illustrée
    let cancelled = false
    const photoUrl = pickFromSrcSet(srcSet, 1200)
    const timer = setTimeout(() => {
      if (!cancelled && canvasRef.current) drawInvitation(canvasRef.current, { eventType, date, host, photoUrl })
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [eventType, date, host])

  const toFile = () =>
    new Promise((resolve) => canvasRef.current.toBlob((blob) => resolve(new File([blob], 'invitation-tranonay.png', { type: 'image/png' })), 'image/png'))

  const download = async () => {
    const file = await toFile()
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const share = async () => {
    setNotice('')
    const file = await toFile()
    const text = `Vous êtes invité(e) chez Tranonay ! Itinéraire : ${mapsDirectionsUrl}`
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Invitation Tranonay', text })
      } else {
        await download()
        setNotice('Carte téléchargée : envoyez-la depuis votre galerie.')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setNotice('Partage impossible, essayez le téléchargement.')
    }
  }

  return (
    <div className="card-surface mt-6">
      <p className="eyebrow">Bonus</p>
      <h3 className="mt-1 text-xl">Votre carte d’invitation</h3>
      <p className="mt-2 text-sm text-slate-600">
        Générée avec les infos de votre demande. Ajoutez votre nom, puis partagez-la à vos invités avec l’itinéraire.
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-start">
        <canvas
          ref={canvasRef}
          className="aspect-[4/5] w-full rounded-2xl bg-slate-100 shadow-soft"
          role="img"
          aria-label="Aperçu de la carte d’invitation"
        />
        <div className="space-y-3">
          <div>
            <label htmlFor="inv-host" className="field-label">De la part de</label>
            <input id="inv-host" className="input-field" value={host} onChange={(e) => setHost(e.target.value)} maxLength={40} placeholder="Votre prénom" />
          </div>
          <button type="button" onClick={share} className="btn-primary w-full">
            <ShareIcon /> Partager l’invitation
          </button>
          <button type="button" onClick={download} className="btn-outline w-full">Télécharger l’image</button>
          <p className="text-xs text-slate-500" aria-live="polite">{notice || `Lien du site : ${SITE_URL.replace('https://', '')}`}</p>
        </div>
      </div>
    </div>
  )
}
