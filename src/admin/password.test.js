import { describe, expect, it } from 'vitest'
import { validateNewPassword } from './password.js'

describe('validateNewPassword', () => {
  it('refuse un mot de passe vide', () => {
    expect(validateNewPassword('', '')).toMatch(/Saisissez/)
    expect(validateNewPassword(undefined, undefined)).toMatch(/Saisissez/)
  })
  it('refuse un mot de passe trop court', () => {
    expect(validateNewPassword('123456789', '123456789')).toMatch(/au moins 10/)
  })
  it('refuse une confirmation différente', () => {
    expect(validateNewPassword('abcdefghij', 'abcdefghiK')).toMatch(/pas identiques/)
  })
  it('accepte un mot de passe valide confirmé', () => {
    expect(validateNewPassword('abcdefghij', 'abcdefghij')).toBeNull()
  })
})
