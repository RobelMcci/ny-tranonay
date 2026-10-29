// État de la construction du site, DÉRIVÉ des données (dernier instantané et version réellement en ligne) :
// il survit donc à un rechargement de la page. Fonctions pures, sans entrée/sortie.

/** Au-delà de ce délai sans que la version en ligne rejoigne le dernier instantané, on parle d'échec ou de lenteur. */
export const STALL_AFTER_MS = 10 * 60 * 1000

/**
 * @typedef {'none' | 'online' | 'building' | 'stalled'} BuildState
 * @typedef {{ state: BuildState, since: Date | null }} BuildStatus
 */

/**
 * @param {{ latest: { id: string, created_at: string } | null, liveVersion: string | null, now: Date, buildStartedAt?: string | Date | null }} input
 *   `latest` : dernier instantané enregistré ; `liveVersion` : `snapshot` de `/version.json` (`null` si inconnu) ;
 *   `buildStartedAt` : relance manuelle de la construction (facultatif) : si elle est plus récente que l'instantané,
 *   le délai de 10 minutes compte depuis elle.
 * @returns {BuildStatus} `since` = date de création du dernier instantané (`null` si absente ou invalide).
 */
export function deriveBuildStatus({ latest, liveVersion, now, buildStartedAt = null }) {
  if (!latest) return { state: 'none', since: null }
  const created = new Date(latest.created_at)
  const since = Number.isNaN(created.getTime()) ? null : created
  if (liveVersion && liveVersion !== 'seed' && liveVersion === latest.id) return { state: 'online', since }
  if (!since) return { state: 'building', since }
  const restarted = buildStartedAt === null ? Number.NaN : new Date(buildStartedAt).getTime()
  const start = Number.isNaN(restarted) ? since.getTime() : Math.max(since.getTime(), restarted)
  return { state: now.getTime() - start >= STALL_AFTER_MS ? 'stalled' : 'building', since }
}

/**
 * Phrase française décrivant l'état.
 * @param {BuildStatus} status
 */
export function describeBuildStatus({ state }) {
  switch (state) {
    case 'online':
      return 'En ligne'
    case 'building':
      return 'Construction en cours…'
    case 'stalled':
      return 'Échec ou lenteur : la version actuelle reste en ligne.'
    default:
      return 'Aucune version publiée pour l’instant.'
  }
}

const SNAPSHOT_DATE = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Indian/Antananarivo',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * Date d'une version en français, à l'heure de Madagascar : « 29 octobre 2026 à 14:05 ».
 * @param {string | Date | null | undefined} value
 * @returns {string} Chaîne vide si la date est absente ou invalide.
 */
export function formatSnapshotDate(value) {
  if (value === null || value === undefined || value === '') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = Object.fromEntries(SNAPSHOT_DATE.formatToParts(date).map((part) => [part.type, part.value]))
  return `${parts.day} ${parts.month} ${parts.year} à ${parts.hour}:${parts.minute}`
}

/**
 * Vérification périodique (toutes les 10 s par défaut) de la version en ligne.
 * Un seul appel à la fois : un tick tombant pendant une vérification en cours est ignoré. En pause quand l'onglet est
 * masqué ; au retour, vérification immédiate. `check(isActive)` doit tester `isActive()` avant d'appliquer son résultat
 * (faux une fois `stop` appelé).
 * @param {(isActive: () => boolean) => Promise<void>} check
 * @param {{ intervalMs?: number, doc?: Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'> }} [options]
 * @returns {() => void} Fonction d'arrêt (idempotente).
 */
export function startPolling(check, { intervalMs = 10_000, doc = globalThis.document } = {}) {
  let active = true
  let pending = false
  const isActive = () => active
  const run = async () => {
    if (!active || pending || doc?.hidden) return
    pending = true
    try {
      await check(isActive)
    } catch {
      // Échec ponctuel : on réessaiera au prochain tick.
    } finally {
      pending = false
    }
  }
  const timer = setInterval(run, intervalMs)
  const onVisibility = () => {
    if (!doc.hidden) run()
  }
  doc?.addEventListener('visibilitychange', onVisibility)
  return () => {
    active = false
    clearInterval(timer)
    doc?.removeEventListener('visibilitychange', onVisibility)
  }
}
