import { describe, expect, it, vi } from 'vitest'
import { loadContent } from './content-loader.mjs'
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
