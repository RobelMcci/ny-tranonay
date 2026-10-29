import { describe, expect, it } from 'vitest'
import { buildVars, interpolate, unknownTokens } from './interpolate.js'
import seed from '../data/content.seed.json'

const norm = (s) => s.replace(/\s/g, ' ')
const vars = buildVars(seed)

describe('buildVars', () => {
  it('expose les prix, les bornes de chambres et les réglages', () => {
    expect(norm(vars['prix.reception_jour'])).toBe('150 000 Ar')
    expect(norm(vars.chambre_min)).toBe('45 000 Ar')
    expect(norm(vars.chambre_max)).toBe('60 000 Ar')
    expect(vars.tel).toBe(seed.settings.phone)
    expect(vars.email).toBe(seed.settings.email)
    expect(vars.horaires).toBe(seed.settings.hoursLabel)
    expect(vars.checkin).toBe(seed.settings.roomCheckIn)
    expect(vars.checkout).toBe(seed.settings.roomCheckOut)
  })

  it('un prix en personnes est un entier brut', () => {
    expect(vars['prix.reception_max_invites']).toBe('50')
  })

  it('chambre_min / chambre_max valent — sans chambre', () => {
    const v = buildVars({ ...seed, rooms: [] })
    expect(v.chambre_min).toBe('—')
    expect(v.chambre_max).toBe('—')
  })

  it('ne plante pas sans prix ni chambres', () => {
    const v = buildVars({ ...seed, prices: [], rooms: [] })
    expect(v['prix.reception_jour']).toBeUndefined()
    expect(v.tel).toBe(seed.settings.phone)
  })
})

describe('interpolate', () => {
  it('remplace une variable de prix', () => {
    const out = interpolate('{{prix.reception_jour}}', vars)
    expect(out).toContain('150')
    expect(norm(out)).toBe('150 000 Ar')
  })

  it('laisse un texte sans variable inchangé', () => {
    expect(interpolate('Bonjour tout le monde', vars)).toBe('Bonjour tout le monde')
  })

  it('accepte des espaces dans les accolades', () => {
    expect(norm(interpolate('{{ prix.reception_jour }}', vars))).toBe('150 000 Ar')
  })

  it('lève une erreur nommant la variable inconnue', () => {
    expect(() => interpolate('a {{prix.recption}} b', vars)).toThrow('Variable inconnue : {{prix.recption}}')
  })

  it('laisse les accolades non fermées telles quelles', () => {
    expect(interpolate('prix {{prix', vars)).toBe('prix {{prix')
    expect(interpolate('{{prix.reception_jour', vars)).toBe('{{prix.reception_jour')
  })

  it('formate un montant à 0', () => {
    const v = buildVars({ ...seed, prices: [{ key: 'x', label: 'x', amount: 0, unit: 'ar' }] })
    expect(norm(interpolate('{{prix.x}}', v))).toBe('0 Ar')
  })
})

describe('jetons mal formés', () => {
  const cases = [
    ['majuscule', '{{Prix.reception_jour}}', 'Prix.reception_jour'],
    ['tiret', '{{prix-reception}}', 'prix-reception'],
    ['espace interne', '{{prix reception}}', 'prix reception'],
    ['vide', '{{}}', ''],
    ['espaces seuls', '{{ }}', ''],
  ]

  it.each(cases)('interpolate refuse : %s', (_label, text, name) => {
    expect(() => interpolate(`a ${text} b`, vars)).toThrow(`Variable inconnue : {{${name}}}`)
  })

  it.each(cases)('unknownTokens signale : %s', (_label, text, name) => {
    expect(unknownTokens(text, vars)).toEqual([name])
  })

  it('unknownTokens garde l’ordre et l’unicité, chaîne vide comprise', () => {
    expect(unknownTokens('{{}} {{Tel}} {{ }} {{Tel}} {{tel}}', vars)).toEqual(['', 'Tel'])
  })

  it('laisse toujours intact un jeton non fermé', () => {
    expect(interpolate('{{Prix', vars)).toBe('{{Prix')
    expect(unknownTokens('{{Prix et {{tel', vars)).toEqual([])
  })
})

describe('unknownTokens', () => {
  it('liste les noms inconnus dans l’ordre, sans doublon', () => {
    expect(unknownTokens('{{tel}} {{x}} {{y}} {{x}}', vars)).toEqual(['x', 'y'])
  })

  it('retourne un tableau vide si tout est connu', () => {
    expect(unknownTokens('{{ tel }} et {{email}}', vars)).toEqual([])
  })
})
