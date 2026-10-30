import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { availableVars, tokenProblem } from './draft-vars.js'

describe('availableVars', () => {
  it('contient toutes les variables pour un brouillon complet', () => {
    const { vars, complete } = availableVars(seed)
    expect(complete).toBe(true)
    expect(Object.keys(vars)).toEqual(expect.arrayContaining(['prix.reception_jour', 'chambre_min', 'chambre_max', 'tel', 'email', 'horaires', 'checkin', 'checkout']))
  })

  it('sans informations générales : seulement les prix et les chambres, jamais de valeur absente', () => {
    const { vars, complete } = availableVars({ ...seed, settings: null })
    expect(complete).toBe(false)
    expect(vars).not.toHaveProperty('tel')
    expect(vars).toHaveProperty('prix.reception_jour')
    expect(vars).toHaveProperty('chambre_min')
  })

  it('supporte un brouillon vide ou absent', () => {
    for (const draft of [{}, null, undefined]) {
      const { vars, complete } = availableVars(draft)
      expect(complete).toBe(false)
      expect(Object.values(vars).every((value) => typeof value === 'string')).toBe(true)
    }
  })
})

describe('tokenProblem', () => {
  const ready = { status: 'ready', vars: availableVars(seed).vars }

  it('variables chargées : délègue à checkTokens', () => {
    expect(tokenProblem(ready, 'Prix {{prix.recption}}')).toContain('prix.recption')
    expect(tokenProblem(ready, 'Prix {{prix.reception_jour}}')).toBeNull()
  })

  it('variables en cours de chargement ou en échec : un texte sans variable est accepté', () => {
    for (const status of ['loading', 'error']) expect(tokenProblem({ status, vars: {} }, 'Bonjour')).toBeNull()
  })

  it('variables en cours de chargement ou en échec : un texte avec variable est refusé, avec une explication', () => {
    expect(tokenProblem({ status: 'loading', vars: {} }, 'Prix {{prix.reception_jour}}')).toContain('chargement')
    expect(tokenProblem({ status: 'error', vars: {} }, 'Prix {{prix.reception_jour}}')).toContain('pas pu être chargées')
  })

  it('texte non textuel : pas de problème', () => {
    expect(tokenProblem({ status: 'error', vars: {} }, null)).toBeNull()
  })
})
