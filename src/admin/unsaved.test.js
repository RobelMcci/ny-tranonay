import { describe, expect, it } from 'vitest'
import { nextFocusIndex, shouldBlock } from './unsaved.js'

const at = (pathname, extra = {}) => ({ pathname, search: '', hash: '', ...extra })

describe('shouldBlock', () => {
  it('bloque un changement d’écran tant que des modifications ne sont pas enregistrées', () => {
    expect(shouldBlock(true, at('/admin/tarifs'), at('/admin/publier'))).toBe(true)
    expect(shouldBlock(true, at('/admin/tarifs'), at('/'))).toBe(true)
  })

  it('ne bloque jamais sans modification (après un enregistrement réussi notamment)', () => {
    expect(shouldBlock(false, at('/admin/tarifs'), at('/admin/publier'))).toBe(false)
  })

  it('ignore une navigation qui reste sur le même écran (ancre, paramètres, barre oblique finale)', () => {
    expect(shouldBlock(true, at('/admin/photos'), at('/admin/photos', { hash: '#emplacements' }))).toBe(false)
    expect(shouldBlock(true, at('/admin/photos'), at('/admin/photos', { search: '?onglet=2' }))).toBe(false)
    expect(shouldBlock(true, at('/admin/photos/'), at('/admin/photos'))).toBe(false)
  })

  it('emplacement inconnu : blocage par prudence', () => {
    expect(shouldBlock(true, undefined, at('/admin'))).toBe(true)
    expect(shouldBlock(true, at('/admin'), undefined)).toBe(true)
  })
})

describe('nextFocusIndex (piège du focus entre les boutons du dialogue)', () => {
  it('Tab avance et revient au premier après le dernier', () => {
    expect(nextFocusIndex(0, 2, false)).toBe(1)
    expect(nextFocusIndex(1, 2, false)).toBe(0)
  })

  it('Maj+Tab recule et passe du premier au dernier', () => {
    expect(nextFocusIndex(1, 2, true)).toBe(0)
    expect(nextFocusIndex(0, 2, true)).toBe(1)
  })

  it('focus hors des boutons : premier (Tab) ou dernier (Maj+Tab)', () => {
    expect(nextFocusIndex(-1, 2, false)).toBe(0)
    expect(nextFocusIndex(-1, 2, true)).toBe(1)
  })
})
