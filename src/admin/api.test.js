import { describe, expect, it } from 'vitest'
import { failureFr } from './api.js'

const ACTION = 'Impossible d’enregistrer la chambre.'
const NO_RIGHTS = 'Vous n’avez pas les droits nécessaires.'
const NETWORK = 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.'

describe('failureFr', () => {
  it('renvoie une Error dont le message commence par l’action', () => {
    const error = failureFr(ACTION, { message: 'boom' })
    expect(error).toBeInstanceOf(Error)
    expect(error.message.startsWith(ACTION)).toBe(true)
  })

  it('traduit les refus de droits (code 42501, 401, 403, RLS)', () => {
    for (const source of [
      { code: '42501', message: 'permission denied for table rooms' },
      { status: 401, message: 'JWT expired' },
      { status: 403, message: 'Forbidden' },
      { message: 'new row violates row-level security policy for table "rooms"' },
      { message: 'Not authorized' },
    ]) {
      expect(failureFr(ACTION, source).message).toBe(`${ACTION} ${NO_RIGHTS}`)
    }
  })

  it('traduit les erreurs réseau', () => {
    for (const message of ['TypeError: Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Network request failed', 'Load failed']) {
      expect(failureFr(ACTION, { message }).message).toBe(`${ACTION} ${NETWORK}`)
    }
  })

  it('explique un identifiant déjà pris (23505)', () => {
    expect(failureFr(ACTION, { code: '23505', message: 'duplicate key value violates unique constraint "rooms_pkey"' }).message).toBe(
      `${ACTION} Cet identifiant existe déjà : modifiez le nom.`,
    )
  })

  it('reste générique et sans texte anglais pour une erreur inconnue', () => {
    for (const source of [{ message: 'syntax error at or near "select"', code: '42601' }, {}, null, undefined, 'oops']) {
      expect(failureFr(ACTION, source).message).toBe(ACTION)
    }
  })

  it('ne laisse jamais fuiter le message brut', () => {
    const raw = 'duplicate key value violates unique constraint "rooms_pkey"'
    expect(failureFr(ACTION, { message: raw, code: '23505' }).message).not.toContain('duplicate')
    expect(failureFr(ACTION, { message: 'Failed to fetch' }).message).not.toMatch(/fetch/i)
  })
})
