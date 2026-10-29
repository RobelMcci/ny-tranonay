import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './auth-errors.js'

describe('authErrorMessage', () => {
  it('traduit les identifiants invalides', () => {
    expect(authErrorMessage({ message: 'Invalid login credentials', status: 400 })).toMatch(/incorrect/i)
  })

  it('signale un problème de connexion réseau', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toMatch(/connexion/i)
    expect(authErrorMessage({ message: 'NetworkError when attempting to fetch resource.' })).toMatch(/connexion/i)
  })

  it('signale trop de tentatives sur un code 429', () => {
    expect(authErrorMessage({ message: 'x', status: 429 })).toMatch(/Trop de tentatives/)
    expect(authErrorMessage({ message: 'email rate limit exceeded' })).toMatch(/Trop de tentatives/)
  })

  it('renvoie un message par défaut non vide pour undefined ou une erreur inconnue', () => {
    expect(authErrorMessage(undefined).length).toBeGreaterThan(0)
    expect(authErrorMessage({ message: 'boom', status: 500 }).length).toBeGreaterThan(0)
  })

  it("n'expose jamais le message technique brut", () => {
    const msg = authErrorMessage({ message: 'duplicate key on user@example.com', status: 500 })
    expect(msg).not.toMatch(/duplicate|user@example\.com/)
  })
})
