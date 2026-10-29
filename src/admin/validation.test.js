import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { buildVars } from '../lib/interpolate.js'
import { checkTokens, parseAmount, parseCount, seoPreview, validateCoordinates, validateEmail, validatePhone, validateUrl } from './validation.js'

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

describe('seoPreview', () => {
  const chars = (n, c = 'a') => c.repeat(n)

  it('titre de 80 caractères : « long » et aperçu coupé avec …, sans dépasser 60', () => {
    const title = Array.from({ length: 16 }, () => 'mots5').join(' ') // 16 × 5 + 15 espaces = 95 ; on prend 80 :
    const eighty = title.slice(0, 80)
    const result = seoPreview(eighty, 'x')
    expect(result.titleStatus).toBe('long')
    expect(result.titleLength).toBe(80)
    expect(result.title.endsWith('…')).toBe(true)
    expect(Array.from(result.title).length).toBeLessThanOrEqual(60)
  })

  it('coupe sur une limite de mot quand c’est possible', () => {
    const title = `${chars(50)} ${chars(30, 'b')}`
    expect(seoPreview(title, '').title).toBe(`${chars(50)}…`)
  })

  it('coupe net quand il n’y a aucun espace, sans dépasser la limite avec le …', () => {
    const result = seoPreview(chars(80), '')
    expect(result.title).toBe(`${chars(59)}…`)
    expect(Array.from(result.title)).toHaveLength(60)
  })

  it('description vide : « empty » ; blanc seulement : « empty »', () => {
    expect(seoPreview('T', '').descriptionStatus).toBe('empty')
    expect(seoPreview('T', ' \n\t ').descriptionStatus).toBe('empty')
    expect(seoPreview(' \t ', 'x').titleStatus).toBe('empty')
    expect(seoPreview('  ', 'x').titleLength).toBe(0)
  })

  it('exactement 60 / 160 caractères : « ok », sans …', () => {
    const result = seoPreview(chars(60), chars(160))
    expect(result.titleStatus).toBe('ok')
    expect(result.descriptionStatus).toBe('ok')
    expect(result.title).toBe(chars(60))
    expect(result.description).toBe(chars(160))
  })

  it('61 / 161 caractères : « long », avec …', () => {
    const result = seoPreview(chars(61), chars(161))
    expect(result.titleStatus).toBe('long')
    expect(result.descriptionStatus).toBe('long')
    expect(result.title.endsWith('…')).toBe(true)
    expect(result.description.endsWith('…')).toBe(true)
    expect(Array.from(result.description).length).toBeLessThanOrEqual(160)
  })

  it('description de 69 caractères : « short » ; 70 : « ok »', () => {
    expect(seoPreview('T', chars(69)).descriptionStatus).toBe('short')
    expect(seoPreview('T', chars(70)).descriptionStatus).toBe('ok')
  })

  it('compte les points de code : accents et émojis', () => {
    const result = seoPreview(chars(59, 'é') + '😀', 'x')
    expect(result.titleLength).toBe(60)
    expect(result.titleStatus).toBe('ok')
    const long = seoPreview(chars(59, 'é') + '😀😀', 'x')
    expect(long.titleStatus).toBe('long')
    expect(long.title.endsWith('…')).toBe(true)
    // Aucune moitié de paire de substitution.
    expect(long.title).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/)
    expect(Array.from(long.title).length).toBeLessThanOrEqual(60)
  })

  it('longueurs calculées sur la saisie nettoyée (espaces de bord retirés)', () => {
    const result = seoPreview(`  ${chars(10)}  `, `\n${chars(100)} `)
    expect(result.titleLength).toBe(10)
    expect(result.descriptionLength).toBe(100)
    expect(result.title).toBe(chars(10))
  })

  it('accepte des valeurs non textuelles sans lever d’erreur', () => {
    expect(seoPreview(undefined, null)).toMatchObject({ title: '', description: '', titleStatus: 'empty', descriptionStatus: 'empty' })
  })
})

describe('checkTokens', () => {
  const vars = buildVars(seed)

  it('nomme une variable inconnue', () => {
    const message = checkTokens(['Prix {{prix.recption}}'], vars)
    expect(message).toContain('prix.recption')
    expect(message).toContain('Insérer une variable')
  })

  it('accepte une variable connue ou aucun jeton', () => {
    expect(checkTokens(['{{prix.reception_jour}}'], vars)).toBeNull()
    expect(checkTokens(['Pas de variable ici', '{ simple }', 'ouvert {{ non fermé'], vars)).toBeNull()
    expect(checkTokens([], vars)).toBeNull()
  })

  it('nomme chaque variable inconnue une seule fois, tous textes confondus', () => {
    const message = checkTokens(['{{a.b}} et {{c.d}}', 'encore {{a.b}}'], vars)
    expect(message.split('{{a.b}}')).toHaveLength(2)
    expect(message).toContain('{{c.d}}')
    expect(message).toContain('Variables inconnues')
  })

  it('un seul nom : forme singulière', () => {
    expect(checkTokens(['{{x}}'], vars)).toMatch(/^Variable inconnue/)
  })

  it('signale les jetons mal formés', () => {
    expect(checkTokens(['{{Prix.x}}'], vars)).toContain('Prix.x')
    expect(checkTokens(['{{}}'], vars)).not.toBeNull()
    expect(checkTokens(['{{ }}'], vars)).not.toBeNull()
  })

  it('ignore les entrées qui ne sont pas du texte', () => {
    expect(checkTokens([null, undefined, 42, {}, 'Prix {{prix.reception_jour}}'], vars)).toBeNull()
    expect(checkTokens([null, '{{zzz}}'], vars)).toContain('zzz')
  })
})
