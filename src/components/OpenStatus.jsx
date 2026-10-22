import { useSyncExternalStore } from 'react'
import { hours } from '../data/site.js'

const subscribe = (notify) => {
  const timer = setInterval(notify, 60_000)
  return () => clearInterval(timer)
}

// Heure de Madagascar, quel que soit le fuseau du visiteur.
const isOpenNow = () => {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: hours.timeZone, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date())
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  const now = (get('hour') % 24) + get('minute') / 60
  return now >= hours.open && now < hours.close
}

/** Pastille « Ouvert maintenant ». Rendu neutre côté serveur, état réel dès l'hydratation. */
export default function OpenStatus({ tone = 'dark', className = '' }) {
  const open = useSyncExternalStore(subscribe, isOpenNow, () => null)
  const palette = tone === 'light' ? 'bg-white/15 text-white ring-white/25 backdrop-blur' : 'bg-white text-[#2B211B] ring-black/10'

  let dot = 'bg-slate-400'
  let label = `Ouvert ${hours.label.toLowerCase()}`
  if (open === true) {
    dot = 'bg-green-400 ping-ring'
    label = `Ouvert maintenant · jusqu’à ${hours.close}h`
  } else if (open === false) {
    dot = 'bg-amber-400'
    label = `Fermé · ouvre à ${hours.open}h`
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${palette} ${className}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}
