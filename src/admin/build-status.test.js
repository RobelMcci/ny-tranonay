import { describe, expect, it } from 'vitest'
import { deriveBuildStatus, describeBuildStatus, formatSnapshotDate } from './build-status.js'

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
