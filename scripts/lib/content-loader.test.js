import { describe, expect, it, vi } from 'vitest'
import { ContentLoadError, isStrictBuild, loadContent } from './content-loader.mjs'
import seed from '../../src/data/content.seed.json'

const ENV = { SUPABASE_URL: 'https://demo.supabase.test/', SUPABASE_ANON_KEY: 'anon-secret-key' }
const ROW_ID = '8f1c2b3a-0000-4000-8000-000000000001'

const clone = (o) => JSON.parse(JSON.stringify(o))
const { version: _version, ...payload } = clone(seed)

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const run = async ({ env = ENV, fetchImpl }) => {
  const log = vi.fn()
  const result = await loadContent({ env, fetchImpl, readSeed: async () => clone(seed), log })
  return { result, log }
}

const expectSeedFallback = (result, log, pattern) => {
  expect(result.source).toBe('seed')
  expect(result.content).toEqual(seed)
  expect(result.content.version).toBeNull()
  expect(log).toHaveBeenCalledTimes(1)
  expect(log.mock.calls[0][0]).toMatch(pattern)
  expect(log.mock.calls[0][0]).not.toContain(ENV.SUPABASE_ANON_KEY)
}

describe('loadContent', () => {
  it('retourne le contenu publié avec la version égale à l’id de la ligne', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([{ id: ROW_ID, payload }]))
    const { result, log } = await run({ fetchImpl })

    expect(result.source).toBe('supabase')
    expect(result.content.version).toBe(ROW_ID)
    expect(result.content.prices).toEqual(payload.prices)
    expect(log).not.toHaveBeenCalled()

    const [url, options] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://demo.supabase.test/rest/v1/published_content?select=id,payload&limit=1')
    expect(options.headers).toEqual({
      apikey: ENV.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    })
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })

  it('se replie sur le seed quand fetch rejette', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    const { result, log } = await run({ fetchImpl })
    expectSeedFallback(result, log, /injoignable.*fetch failed.*repli sur le seed/)
  })

  it('se replie sur le seed quand le délai est dépassé', async () => {
    const fetchImpl = vi.fn(async () => {
      throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' })
    })
    const { result, log } = await run({ fetchImpl })
    expectSeedFallback(result, log, /injoignable.*repli sur le seed/)
  })

  it('se replie sur le seed sur un statut HTTP 500', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ message: 'boom' }, 500))
    const { result, log } = await run({ fetchImpl })
    expectSeedFallback(result, log, /HTTP 500.*repli sur le seed/)
  })

  it('se replie sur le seed quand le corps n’est pas du JSON', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <')
      },
    }))
    const { result, log } = await run({ fetchImpl })
    expectSeedFallback(result, log, /illisible.*repli sur le seed/)
  })

  it('se replie sur le seed quand aucun instantané n’est publié (tableau vide)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([]))
    const { result, log } = await run({ fetchImpl })
    expectSeedFallback(result, log, /aucun instantané publié.*repli sur le seed/)
  })

  it('se replie sur le seed quand le payload n’a pas de prices', async () => {
    const { prices: _prices, ...incomplete } = payload
    const fetchImpl = vi.fn(async () => jsonResponse([{ id: ROW_ID, payload: incomplete }]))
    const { result, log } = await run({ fetchImpl })
    expectSeedFallback(result, log, /invalide.*prices.*repli sur le seed/)
  })

  it('se replie sur le seed quand un prix est négatif', async () => {
    const bad = clone(payload)
    bad.prices[0].amount = -1
    const fetchImpl = vi.fn(async () => jsonResponse([{ id: ROW_ID, payload: bad }]))
    const { result, log } = await run({ fetchImpl })
    expectSeedFallback(result, log, /invalide.*prices.*repli sur le seed/)
  })

  it.each([
    ['SUPABASE_URL', { SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY }],
    ['SUPABASE_ANON_KEY', { SUPABASE_URL: ENV.SUPABASE_URL }],
    ['les deux', {}],
    ['variables vides', { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }],
  ])('se replie sur le seed sans appel réseau quand les variables manquent (%s)', async (_name, env) => {
    const fetchImpl = vi.fn()
    const { result, log } = await run({ env, fetchImpl })
    expect(fetchImpl).not.toHaveBeenCalled()
    expectSeedFallback(result, log, /SUPABASE_URL.*SUPABASE_ANON_KEY.*repli sur le seed/)
  })

  it('accepte un readSeed synchrone', async () => {
    const log = vi.fn()
    const result = await loadContent({ env: {}, fetchImpl: vi.fn(), readSeed: () => clone(seed), log })
    expect(result.source).toBe('seed')
    expect(result.content).toEqual(seed)
  })
})

describe('loadContent en mode strict (production Netlify)', () => {
  const runStrict = async ({ env = ENV, fetchImpl }) => {
    const log = vi.fn()
    const readSeed = vi.fn(async () => clone(seed))
    const outcome = await loadContent({ env, fetchImpl, readSeed, log, strict: true }).then(
      (result) => ({ result }),
      (error) => ({ error }),
    )
    return { ...outcome, log, readSeed }
  }

  const { prices: _prices, ...withoutPrices } = payload
  const negative = clone(payload)
  negative.prices[0].amount = -1

  it.each([
    ['fetch rejette', async () => { throw new TypeError('fetch failed') }, /injoignable.*fetch failed/],
    [
      'délai dépassé',
      async () => { throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }) },
      /injoignable.*délai/,
    ],
    ['HTTP 500', async () => jsonResponse({ message: 'boom' }, 500), /HTTP 500/],
    ['projet en pause (HTTP 503)', async () => jsonResponse({ message: 'paused' }, 503), /HTTP 503/],
    [
      'corps illisible',
      async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <') } }),
      /illisible/,
    ],
    ['réponse qui n’est pas un tableau', async () => jsonResponse({ id: ROW_ID, payload }), /inattendue/],
    ['sections manquantes', async () => jsonResponse([{ id: ROW_ID, payload: withoutPrices }]), /invalide.*prices/],
    ['prix négatif', async () => jsonResponse([{ id: ROW_ID, payload: negative }]), /invalide.*prices/],
  ])('lève ContentLoadError sans lire le seed (%s)', async (_name, impl, pattern) => {
    const { error, result, readSeed, log } = await runStrict({ fetchImpl: vi.fn(impl) })
    expect(result).toBeUndefined()
    expect(error).toBeInstanceOf(ContentLoadError)
    expect(error.name).toBe('ContentLoadError')
    expect(error.message).toMatch(pattern)
    expect(error.message).not.toContain(ENV.SUPABASE_ANON_KEY)
    expect(readSeed).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it('aucun instantané publié (HTTP 200, tableau vide) : repli sur le seed, même en strict', async () => {
    const { error, result, log } = await runStrict({ fetchImpl: vi.fn(async () => jsonResponse([])) })
    expect(error).toBeUndefined()
    expectSeedFallback(result, log, /aucun instantané publié.*repli sur le seed/)
  })

  it('le contenu publié valide est renvoyé normalement', async () => {
    const { error, result } = await runStrict({ fetchImpl: vi.fn(async () => jsonResponse([{ id: ROW_ID, payload }])) })
    expect(error).toBeUndefined()
    expect(result.source).toBe('supabase')
    expect(result.content.version).toBe(ROW_ID)
  })

  it('le mode non strict reste un repli sur le seed pour une réponse qui n’est pas un tableau', async () => {
    const { result, log } = await run({ fetchImpl: vi.fn(async () => jsonResponse({ id: ROW_ID, payload })) })
    expectSeedFallback(result, log, /inattendue.*repli sur le seed/)
  })
})

describe('isStrictBuild', () => {
  const PROD = { NETLIFY: 'true', CONTEXT: 'production', ...ENV }

  it('strict en production Netlify avec les deux variables Supabase', () => {
    expect(isStrictBuild(PROD)).toBe(true)
  })

  it.each([
    ['hors Netlify', { ...PROD, NETLIFY: undefined }],
    ['NETLIFY différent de "true"', { ...PROD, NETLIFY: '1' }],
    ['aperçu de déploiement', { ...PROD, CONTEXT: 'deploy-preview' }],
    ['déploiement de branche', { ...PROD, CONTEXT: 'branch-deploy' }],
    ['CONTEXT absent', { ...PROD, CONTEXT: undefined }],
    ['SUPABASE_URL absente', { ...PROD, SUPABASE_URL: undefined }],
    ['SUPABASE_ANON_KEY absente', { ...PROD, SUPABASE_ANON_KEY: undefined }],
    ['variables vides', { ...PROD, SUPABASE_URL: ' ', SUPABASE_ANON_KEY: '' }],
    ['échappatoire CONTENT_ALLOW_SEED_FALLBACK=1', { ...PROD, CONTENT_ALLOW_SEED_FALLBACK: '1' }],
    ['environnement vide', {}],
    ['environnement absent', undefined],
  ])('non strict : %s', (_name, env) => {
    expect(isStrictBuild(env)).toBe(false)
  })

  it('l’échappatoire ne vaut que pour « 1 » ou « true »', () => {
    expect(isStrictBuild({ ...PROD, CONTENT_ALLOW_SEED_FALLBACK: 'true' })).toBe(false)
    expect(isStrictBuild({ ...PROD, CONTENT_ALLOW_SEED_FALLBACK: '0' })).toBe(true)
    expect(isStrictBuild({ ...PROD, CONTENT_ALLOW_SEED_FALLBACK: '' })).toBe(true)
  })
})
