import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './auth-errors.js'

describe('authErrorMessage', () => {
  it('traduit les identifiants invalides', () => {
    expect(authErrorMessage({ message: 'Invalid login credentials', status: 400 })).toMatch(/incorrect/i)
  })

  it('privilégie le code invalid_credentials', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'autre texte', status: 400 })).toMatch(/incorrect/i)
  })

  it('traduit un nouveau mot de passe identique ou trop faible', () => {
    expect(authErrorMessage({ code: 'same_password', message: 'x', status: 422 })).toMatch(/différent/)
    expect(authErrorMessage({ code: 'weak_password', message: 'x', status: 422 })).toMatch(/trop faible/)
    expect(authErrorMessage({ message: 'New password should be different from the old password.' })).toMatch(/différent/)
  })

  it("n'assimile pas une erreur de programmation à un problème réseau", () => {
    expect(authErrorMessage(new TypeError('x is not a function'))).not.toMatch(/connexion/i)
  })

  it('signale un problème de connexion réseau', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toMatch(/connexion/i)
    expect(authErrorMessage({ message: 'NetworkError when attempting to fetch resource.' })).toMatch(/connexion/i)
    expect(authErrorMessage({ message: 'Load failed' })).toMatch(/connexion/i)
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', message: 'x', status: 0 })).toMatch(/connexion/i)
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
