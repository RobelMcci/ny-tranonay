import { afterEach, describe, expect, it, vi } from 'vitest'
import { deriveBuildStatus, describeBuildStatus, formatSnapshotDate, startPolling } from './build-status.js'

const CREATED = '2026-10-29T10:00:00.000Z'
const latest = { id: 'snap-2', created_at: CREATED }
const minutes = (n) => new Date(Date.parse(CREATED) + n * 60_000)

describe('deriveBuildStatus', () => {
  it('« none » quand aucune version n’existe', () => {
    expect(deriveBuildStatus({ latest: null, liveVersion: 'seed', now: minutes(1) })).toEqual({ state: 'none', since: null })
  })

  it('« online » quand la version en ligne est la dernière', () => {
    const status = deriveBuildStatus({ latest, liveVersion: 'snap-2', now: minutes(1) })
    expect(status.state).toBe('online')
    expect(status.since).toEqual(new Date(CREATED))
  })

  it('« building » tant que moins de 10 minutes se sont écoulées', () => {
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(0) }).state).toBe('building')
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(9.99) }).state).toBe('building')
  })

  it('« stalled » à partir de 10 minutes pile', () => {
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(10) }).state).toBe('stalled')
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(120) }).state).toBe('stalled')
  })

  it('une version en ligne nulle ou « seed » ne correspond jamais', () => {
    expect(deriveBuildStatus({ latest, liveVersion: null, now: minutes(1) }).state).toBe('building')
    expect(deriveBuildStatus({ latest, liveVersion: 'seed', now: minutes(1) }).state).toBe('building')
    expect(deriveBuildStatus({ latest: { id: 'seed', created_at: CREATED }, liveVersion: 'seed', now: minutes(1) }).state).toBe('building')
  })

  it('une date invalide compte comme « building »', () => {
    const status = deriveBuildStatus({ latest: { id: 'x', created_at: 'pas une date' }, liveVersion: null, now: minutes(500) })
    expect(status).toEqual({ state: 'building', since: null })
  })

  it('une horloge en retard sur le serveur reste « building »', () => {
    expect(deriveBuildStatus({ latest, liveVersion: null, now: minutes(-5) }).state).toBe('building')
  })
})

describe('deriveBuildStatus avec buildStartedAt (relance manuelle)', () => {
  it('le délai de 10 minutes compte depuis la relance si elle est plus récente, `since` garde la date de la version', () => {
    const restarted = minutes(30).toISOString()
    const status = deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(35), buildStartedAt: restarted })
    expect(status).toEqual({ state: 'building', since: new Date(CREATED) })
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(40), buildStartedAt: restarted }).state).toBe('stalled')
  })

  it('une relance plus ancienne que la version, absente ou invalide est ignorée', () => {
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(11), buildStartedAt: minutes(-5) }).state).toBe('stalled')
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(11), buildStartedAt: null }).state).toBe('stalled')
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-1', now: minutes(11), buildStartedAt: 'nope' }).state).toBe('stalled')
  })

  it('« online » et « none » ne dépendent pas de la relance', () => {
    expect(deriveBuildStatus({ latest, liveVersion: 'snap-2', now: minutes(99), buildStartedAt: minutes(98) }).state).toBe('online')
    expect(deriveBuildStatus({ latest: null, liveVersion: null, now: minutes(1), buildStartedAt: minutes(1) }).state).toBe('none')
  })
})

describe('describeBuildStatus', () => {
  it('décrit chaque état en français', () => {
    expect(describeBuildStatus({ state: 'online', since: null })).toBe('En ligne')
    expect(describeBuildStatus({ state: 'building', since: null })).toBe('Construction en cours…')
    expect(describeBuildStatus({ state: 'stalled', since: null })).toBe('Échec ou lenteur : la version actuelle reste en ligne.')
    expect(describeBuildStatus({ state: 'none', since: null })).toBe('Aucune version publiée pour l’instant.')
  })
})

describe('formatSnapshotDate', () => {
  it('écrit la date en français à l’heure de Madagascar (UTC+3)', () => {
    expect(formatSnapshotDate('2026-10-29T11:05:00Z')).toBe('29 octobre 2026 à 14:05')
    expect(formatSnapshotDate('2026-01-01T22:30:00Z')).toBe('2 janvier 2026 à 01:30')
  })

  it('renvoie une chaîne vide pour une date invalide', () => {
    expect(formatSnapshotDate('nope')).toBe('')
    expect(formatSnapshotDate(null)).toBe('')
  })
})

describe('startPolling', () => {
  afterEach(() => vi.useRealTimers())

  /** Faux `document` : `hidden` réglable, écouteurs enregistrés. */
  const fakeDoc = () => {
    const listeners = new Set()
    return {
      hidden: false,
      addEventListener: (type, fn) => type === 'visibilitychange' && listeners.add(fn),
      removeEventListener: (type, fn) => type === 'visibilitychange' && listeners.delete(fn),
      show() {
        this.hidden = false
        for (const fn of [...listeners]) fn()
      },
      listeners,
    }
  }

  it('vérifie toutes les 10 secondes puis s’arrête', async () => {
    vi.useFakeTimers()
    const check = vi.fn(async () => {})
    const stop = startPolling(check, { doc: fakeDoc() })
    await vi.advanceTimersByTimeAsync(9_999)
    expect(check).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(check).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(20_000)
    expect(check).toHaveBeenCalledTimes(3)
    stop()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(check).toHaveBeenCalledTimes(3)
  })

  it('ne chevauche jamais deux vérifications : le tick est ignoré tant qu’une est en cours', async () => {
    vi.useFakeTimers()
    let release
    const check = vi.fn(() => new Promise((resolve) => (release = resolve)))
    startPolling(check, { doc: fakeDoc() })
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(check).toHaveBeenCalledTimes(1)
    release()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(check).toHaveBeenCalledTimes(2)
  })

  it('une vérification qui échoue ne bloque pas les suivantes', async () => {
    vi.useFakeTimers()
    const check = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined)
    startPolling(check, { doc: fakeDoc() })
    await vi.advanceTimersByTimeAsync(20_000)
    expect(check).toHaveBeenCalledTimes(2)
  })

  it('se met en pause onglet masqué et vérifie aussitôt au retour', async () => {
    vi.useFakeTimers()
    const doc = fakeDoc()
    const check = vi.fn(async () => {})
    startPolling(check, { doc })
    doc.hidden = true
    await vi.advanceTimersByTimeAsync(60_000)
    expect(check).not.toHaveBeenCalled()
    doc.show()
    await vi.advanceTimersByTimeAsync(0)
    expect(check).toHaveBeenCalledTimes(1)
  })

  it('retire son écouteur à l’arrêt', () => {
    vi.useFakeTimers()
    const doc = fakeDoc()
    const stop = startPolling(async () => {}, { doc })
    expect(doc.listeners.size).toBe(1)
    stop()
    expect(doc.listeners.size).toBe(0)
  })

  it('ignore le résultat d’une vérification terminée après l’arrêt (le callback décide via `isActive`)', async () => {
    vi.useFakeTimers()
    let release
    const seen = []
    const stop = startPolling((isActive) => new Promise((resolve) => (release = () => { seen.push(isActive()); resolve() })), { doc: fakeDoc() })
    await vi.advanceTimersByTimeAsync(10_000)
    stop()
    release()
    await vi.advanceTimersByTimeAsync(0)
    expect(seen).toEqual([false])
  })
})
