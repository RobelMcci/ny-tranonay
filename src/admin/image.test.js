import { describe, expect, it, vi } from 'vitest'
import { QUALITIES, encodeUnderLimit, fitWithin, imageTypeError, newPhotoKey, planAttempts, resizeToJpeg } from './image.js'

describe('fitWithin', () => {
  it('réduit une photo paysage au plus grand côté', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 })
  })

  it('ne l’agrandit jamais', () => {
    expect(fitWithin(1000, 800, 2000)).toEqual({ width: 1000, height: 800 })
  })

  it('réduit une photo portrait', () => {
    expect(fitWithin(1000, 4000, 2000)).toEqual({ width: 500, height: 2000 })
  })

  it('laisse inchangée une photo dont le grand côté vaut exactement la limite', () => {
    expect(fitWithin(2000, 1500, 2000)).toEqual({ width: 2000, height: 1500 })
    expect(fitWithin(1500, 2000, 2000)).toEqual({ width: 1500, height: 2000 })
  })

  it('arrondit à l’entier le plus proche', () => {
    expect(fitWithin(3001, 2000, 1000)).toEqual({ width: 1000, height: 666 })
    expect(fitWithin(2000, 3001, 1000)).toEqual({ width: 666, height: 1000 })
  })

  it('ne renvoie jamais une dimension nulle', () => {
    expect(fitWithin(10000, 1, 2000)).toEqual({ width: 2000, height: 1 })
    expect(fitWithin(1, 10000, 2000)).toEqual({ width: 1, height: 2000 })
  })

  it('refuse les dimensions nulles, négatives ou non finies', () => {
    expect(() => fitWithin(0, 100, 2000)).toThrow(Error)
    expect(() => fitWithin(100, 0, 2000)).toThrow(Error)
    expect(() => fitWithin(-100, 100, 2000)).toThrow(Error)
    expect(() => fitWithin(100, -1, 2000)).toThrow(Error)
    expect(() => fitWithin(Number.NaN, 100, 2000)).toThrow(Error)
    expect(() => fitWithin(100, Infinity, 2000)).toThrow(Error)
    expect(() => fitWithin('100', 100, 2000)).toThrow(Error)
  })

  it('refuse une limite nulle, négative ou non finie', () => {
    expect(() => fitWithin(100, 100, 0)).toThrow(Error)
    expect(() => fitWithin(100, 100, -5)).toThrow(Error)
    expect(() => fitWithin(100, 100, Number.NaN)).toThrow(Error)
  })
})

describe('imageTypeError', () => {
  it('accepte JPEG, PNG et WebP', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'IMAGE/JPEG']) expect(imageTypeError({ type })).toBeNull()
  })

  it('explique le refus en français', () => {
    expect(imageTypeError({ type: 'application/pdf' })).toMatch(/JPEG, PNG ou WebP/)
    expect(imageTypeError({ type: 'image/heic' })).toMatch(/HEIC/)
    expect(imageTypeError({})).toMatch(/JPEG, PNG ou WebP/)
    expect(imageTypeError(null)).toMatch(/JPEG, PNG ou WebP/)
  })
})

describe('planAttempts', () => {
  it('essaie 0,85 puis 0,75 puis 0,65 à la taille demandée, puis la moitié à 0,7', () => {
    expect(QUALITIES).toEqual([0.85, 0.75, 0.65])
    expect(planAttempts(2000)).toEqual([
      { maxSide: 2000, quality: 0.85 },
      { maxSide: 2000, quality: 0.75 },
      { maxSide: 2000, quality: 0.65 },
      { maxSide: 1000, quality: 0.7 },
    ])
  })
})

describe('encodeUnderLimit', () => {
  const blobOf = (size) => ({ size })
  const attempts = planAttempts(2000)

  it('s’arrête au premier résultat sous la limite', async () => {
    const encode = vi.fn(async ({ quality }) => ({ blob: blobOf(quality === 0.85 ? 3_000_000 : 1_500_000), width: 10, height: 5 }))
    const result = await encodeUnderLimit({ attempts, maxBytes: 2_000_000, encode })
    expect(result.blob.size).toBe(1_500_000)
    expect(encode.mock.calls.map(([attempt]) => attempt.quality)).toEqual([0.85, 0.75])
  })

  it('accepte un fichier exactement à la limite', async () => {
    const encode = vi.fn(async () => ({ blob: blobOf(2_000_000), width: 1, height: 1 }))
    await expect(encodeUnderLimit({ attempts, maxBytes: 2_000_000, encode })).resolves.toBeTruthy()
    expect(encode).toHaveBeenCalledTimes(1)
  })

  it('réduit la taille en dernier recours', async () => {
    const encode = vi.fn(async ({ maxSide }) => ({ blob: blobOf(maxSide === 1000 ? 900_000 : 2_500_000), width: 1, height: 1 }))
    const result = await encodeUnderLimit({ attempts, maxBytes: 2_000_000, encode })
    expect(result.blob.size).toBe(900_000)
    expect(encode).toHaveBeenCalledTimes(4)
  })

  it('refuse avec un message français quand la limite reste dépassée', async () => {
    const encode = vi.fn(async () => ({ blob: blobOf(5_000_000), width: 1, height: 1 }))
    await expect(encodeUnderLimit({ attempts, maxBytes: 2_000_000, encode })).rejects.toThrow(/trop lourde.*2 Mo/)
    expect(encode).toHaveBeenCalledTimes(4)
  })
})

describe('resizeToJpeg', () => {
  const file = (type, name = 'photo') => ({ type, name, size: 1234 })
  const bitmap = (width, height) => ({ width, height, close: vi.fn() })

  /** Faux adaptateurs : `sizeFor(attempt)` donne la taille du JPEG produit. */
  const fakes = ({ image = bitmap(4000, 3000), sizeFor = () => 1_000_000, decodeError = null } = {}) => ({
    decode: vi.fn(async () => {
      if (decodeError) throw decodeError
      return image
    }),
    encode: vi.fn(async (source, attempt) => ({ blob: { size: sizeFor(attempt), type: 'image/jpeg' }, width: attempt.width, height: attempt.height })),
    release: vi.fn(),
  })

  it('redimensionne à 2000 px au plus et renvoie le JPEG avec ses dimensions', async () => {
    const deps = fakes()
    const result = await resizeToJpeg(file('image/png'), {}, deps)
    expect(result.width).toBe(2000)
    expect(result.height).toBe(1500)
    expect(result.blob.type).toBe('image/jpeg')
    expect(deps.encode.mock.calls[0][1]).toEqual({ width: 2000, height: 1500, quality: 0.85 })
    expect(deps.release).toHaveBeenCalledTimes(1)
  })

  it('accepte JPEG, PNG et WebP', async () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      await expect(resizeToJpeg(file(type), {}, fakes())).resolves.toBeTruthy()
    }
  })

  it.each([
    ['application/pdf', /JPEG, PNG ou WebP/],
    ['image/heic', /HEIC/],
    ['image/gif', /GIF/],
    ['image/svg+xml', /SVG/],
    ['', /JPEG, PNG ou WebP/],
  ])('refuse le type %j avec un message français', async (type, message) => {
    const deps = fakes()
    await expect(resizeToJpeg(file(type), {}, deps)).rejects.toThrow(message)
    expect(deps.decode).not.toHaveBeenCalled()
  })

  it('refuse une image illisible', async () => {
    const deps = fakes({ decodeError: new Error('The source image could not be decoded.') })
    const error = await resizeToJpeg(file('image/jpeg'), {}, deps).catch((e) => e)
    expect(error.message).toMatch(/Impossible de lire/)
    expect(error.message).not.toMatch(/decoded/)
    expect(deps.encode).not.toHaveBeenCalled()
  })

  it('baisse la qualité tant que le fichier est trop lourd', async () => {
    const deps = fakes({ sizeFor: ({ quality }) => (quality >= 0.85 ? 2_600_000 : quality >= 0.75 ? 2_200_000 : 1_900_000) })
    const result = await resizeToJpeg(file('image/jpeg'), {}, deps)
    expect(result.blob.size).toBe(1_900_000)
    expect(deps.encode.mock.calls.map(([, attempt]) => attempt.quality)).toEqual([0.85, 0.75, 0.65])
  })

  it('réduit encore la taille en dernier recours, puis refuse', async () => {
    const heavy = fakes({ sizeFor: () => 9_000_000 })
    await expect(resizeToJpeg(file('image/jpeg'), {}, heavy)).rejects.toThrow(/trop lourde/)
    expect(heavy.encode).toHaveBeenCalledTimes(4)
    expect(heavy.encode.mock.calls[3][1]).toEqual({ width: 1000, height: 750, quality: 0.7 })
    expect(heavy.release).toHaveBeenCalledTimes(1)

    const rescued = fakes({ sizeFor: ({ width }) => (width <= 1000 ? 800_000 : 9_000_000) })
    const result = await resizeToJpeg(file('image/jpeg'), {}, rescued)
    expect(result).toMatchObject({ width: 1000, height: 750 })
  })

  it('respecte maxSide et maxBytes demandés et n’agrandit pas une petite image', async () => {
    const deps = fakes({ image: bitmap(800, 600), sizeFor: () => 150_000 })
    const result = await resizeToJpeg(file('image/webp'), { maxSide: 1200, maxBytes: 100_000 }, deps).catch((e) => e)
    expect(result).toBeInstanceOf(Error)
    const ok = await resizeToJpeg(file('image/webp'), { maxSide: 1200, maxBytes: 200_000 }, deps)
    expect(ok).toMatchObject({ width: 800, height: 600 })
  })

  it('libère l’image même quand l’encodage échoue', async () => {
    const deps = fakes()
    deps.encode.mockRejectedValue(new Error('toBlob a échoué'))
    await expect(resizeToJpeg(file('image/jpeg'), {}, deps)).rejects.toThrow(/Impossible/)
    expect(deps.release).toHaveBeenCalledTimes(1)
  })

  it('refuse une image aux dimensions nulles', async () => {
    const deps = fakes({ image: bitmap(0, 0) })
    await expect(resizeToJpeg(file('image/jpeg'), {}, deps)).rejects.toThrow(/Impossible de lire/)
  })
})

describe('newPhotoKey', () => {
  const VALID = /^[A-Za-z0-9_-]{1,40}$/

  it('construit une clé sans accents à partir du texte alternatif', () => {
    expect(newPhotoKey('Façade éclairée à la tombée de la nuit', [])).toBe('facade-eclairee-a-la-tombee-de-la-nuit')
  })

  it('ajoute -2, -3… en cas de doublon', () => {
    expect(newPhotoKey('Piscine', ['piscine'])).toBe('piscine-2')
    expect(newPhotoKey('Piscine', ['piscine', 'piscine-2'])).toBe('piscine-3')
  })

  it('compare sans tenir compte de la casse (nom de fichier au build)', () => {
    expect(newPhotoKey('Piscine', ['Piscine'])).toBe('piscine-2')
  })

  it('retombe sur « photo » quand le texte ne donne aucun caractère utilisable', () => {
    expect(newPhotoKey('', [])).toBe('photo')
    expect(newPhotoKey('   ', [])).toBe('photo')
    expect(newPhotoKey('😀🎉', [])).toBe('photo')
    expect(newPhotoKey('😀🎉', ['photo'])).toBe('photo-2')
  })

  it('reste à 40 caractères au plus, suffixe compris', () => {
    const long = 'Une très très longue description de la salle de réception décorée pour un mariage'
    const key = newPhotoKey(long, [])
    expect(key.length).toBeLessThanOrEqual(40)
    expect(key).toMatch(VALID)
    const second = newPhotoKey(long, [key])
    expect(second.length).toBeLessThanOrEqual(40)
    expect(second).toMatch(/-2$/)
    expect(second).not.toBe(key)
    expect(newPhotoKey(long, [key, second])).toMatch(/-3$/)
  })

  it('ne produit que des lettres, chiffres, _ et -', () => {
    for (const alt of ['../../etc/passwd', 'a/b\\c', 'Œuf & café ☕ 100%', 'x'.repeat(100)]) {
      expect(newPhotoKey(alt, [])).toMatch(VALID)
    }
  })
})
