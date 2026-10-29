import { describe, expect, it } from 'vitest'
import { parseAmount, parseCount, validateCoordinates, validateEmail, validatePhone, validateUrl } from './validation.js'

describe('parseAmount', () => {
  it.each([
    ['150000', 150000],
    ['150 000', 150000],
    ['150\u00A0000', 150000], // espace insécable
    ['150\u202F000\u00A0Ar', 150000], // espace fine insécable
    ['150000 Ar', 150000],
    ['150 000 AR', 150000],
    ['150 000ar', 150000],
    ['  42  ', 42],
    ['0', 0],
    [150000, 150000],
    [0, 0],
    ['100000000', 100_000_000],
  ])('accepte %j', (input, value) => {
    expect(parseAmount(input)).toEqual({ ok: true, value })
  })

  it.each([
    ['', 'vide'],
    ['   ', 'espaces'],
    ['Ar', 'suffixe seul'],
    ['-5', 'négatif'],
    ['12,5', 'décimal virgule'],
    ['12.5', 'décimal point'],
    ['abc', 'texte'],
    ['1e9', 'notation scientifique'],
    ['100000001', 'trop grand'],
    [100000001, 'nombre trop grand'],
    [1.5, 'nombre décimal'],
    [-3, 'nombre négatif'],
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [null, 'null'],
    [undefined, 'undefined'],
  ])('refuse %j (%s) avec un message', (input) => {
    const result = parseAmount(input)
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('parseCount', () => {
  it('accepte un entier dans les bornes', () => {
    expect(parseCount('50')).toEqual({ ok: true, value: 50 })
    expect(parseCount(' 1 000 ', { min: 1, max: 1000 })).toEqual({ ok: true, value: 1000 })
    expect(parseCount(0)).toEqual({ ok: true, value: 0 })
  })

  it('applique le minimum et le maximum en les citant', () => {
    const low = parseCount('0', { min: 1, max: 1000 })
    expect(low.ok).toBe(false)
    expect(low.error).toContain('1')
    const high = parseCount('1001', { min: 1, max: 1000 })
    expect(high.ok).toBe(false)
    expect(high.error).toContain('1 000')
    expect(parseCount('1000001').ok).toBe(false)
  })

  it('refuse vide, décimal, texte, « Ar » et valeurs non finies', () => {
    for (const input of ['', '1,5', '2.5', 'dix', '5 Ar', '-1', '1e3', NaN, Infinity, 2.5]) {
      const result = parseCount(input)
      expect(result.ok, String(input)).toBe(false)
      expect(result.error).toBeTruthy()
    }
  })
})

describe('validateUrl', () => {
  it('refuse une adresse incomplète', () => {
    expect(validateUrl('facebook')).toBeTruthy()
    expect(validateUrl('ftp://exemple.mg')).toBeTruthy()
    expect(validateUrl('https://')).toBeTruthy()
    expect(validateUrl('https://exemple .mg')).toBeTruthy()
  })

  it('exige une adresse', () => {
    expect(validateUrl('')).toBe('Adresse requise')
    expect(validateUrl('   ')).toBe('Adresse requise')
  })

  it('accepte une adresse http(s) avec hôte', () => {
    expect(validateUrl('https://m.me/61588385663321')).toBeNull()
    expect(validateUrl('http://exemple.mg')).toBeNull()
    expect(validateUrl(' https://dirickx.mg ')).toBeNull()
  })
})

describe('validateEmail', () => {
  it('refuse les adresses invalides', () => {
    expect(validateEmail('a@b')).toBeTruthy()
    expect(validateEmail('')).toBeTruthy()
    expect(validateEmail('sans-arobase.mg')).toBeTruthy()
  })
  it('accepte une adresse valide', () => {
    expect(validateEmail('tranonay4@gmail.com')).toBeNull()
  })
})

describe('validatePhone', () => {
  it('refuse les numéros invalides', () => {
    expect(validatePhone('12')).toBeTruthy()
    expect(validatePhone('')).toBeTruthy()
    expect(validatePhone('abc 034 21 410 31')).toBeTruthy()
  })
  it('accepte les formats courants', () => {
    expect(validatePhone('+261 34 21 410 31')).toBeNull()
    expect(validatePhone('034.21.410.31')).toBeNull()
    expect(validatePhone('(034) 21-410-31')).toBeNull()
  })
})

describe('validateCoordinates', () => {
  it('accepte des coordonnées valides, en nombres ou en texte', () => {
    expect(validateCoordinates(-18.945199, 47.431368)).toBeNull()
    expect(validateCoordinates('-18.945199', '47,431368')).toBeNull()
    expect(validateCoordinates(90, -180)).toBeNull()
  })
  it('refuse les valeurs hors bornes ou non numériques', () => {
    expect(validateCoordinates(200, 0)).toBeTruthy()
    expect(validateCoordinates(0, 181)).toBeTruthy()
    expect(validateCoordinates('abc', 0)).toBeTruthy()
    expect(validateCoordinates('', '')).toBeTruthy()
    expect(validateCoordinates(NaN, 0)).toBeTruthy()
  })
})
