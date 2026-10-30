import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isLocalUrl, runSeed } from './seed-db.mjs'

const content = JSON.parse(readFileSync(new URL('../../src/data/content.seed.json', import.meta.url), 'utf8'))
const URL_LOCAL = 'http://127.0.0.1:54321'
const SECRET = 'cle-service-secrete-de-test'

/** Faux PostgREST : `counts` = lignes déjà présentes par table ; `failOn` = (méthode + chemin) qui répond 500. */
function fakeApi({ counts = {}, failOn = null } = {}) {
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    const path = url.replace(`${URL_LOCAL}/rest/v1/`, '')
    const method = init.method ?? 'GET'
    calls.push({ method, path, headers: init.headers, body: init.body ? JSON.parse(init.body) : undefined })
    if (failOn && `${method} ${path}`.startsWith(failOn)) {
      return new Response(JSON.stringify({ code: 'XX000', message: 'boom' }), { status: 500 })
    }
    if (method === 'GET') {
      const table = path.split('?')[0]
      const total = counts[table] ?? 0
      return new Response('[]', { status: 200, headers: { 'content-range': total ? `0-0/${total}` : '*/0' } })
    }
    return new Response(null, { status: 201 })
  }
  return { calls, fetchImpl }
}

const run = async (api, { argv = [], env = { SUPABASE_URL: URL_LOCAL, SUPABASE_SERVICE_ROLE_KEY: SECRET } } = {}) => {
  const logs = []
  const code = await runSeed({ content, env, argv, fetchImpl: api.fetchImpl, log: (message) => logs.push(message) })
  return { code, logs }
}

describe('isLocalUrl', () => {
  it('reconnaît les adresses locales et refuse les autres', () => {
    expect(isLocalUrl('http://localhost:54321')).toBe(true)
    expect(isLocalUrl('http://127.0.0.1:54321')).toBe(true)
    expect(isLocalUrl('http://[::1]:54321')).toBe(true)
    expect(isLocalUrl('https://abc.supabase.co')).toBe(false)
    expect(isLocalUrl('https://localhost.evil.example')).toBe(false)
    expect(isLocalUrl('pas une adresse')).toBe(false)
  })
})

describe('runSeed', () => {
  it('importe dans l’ordre prévu puis publie « Import initial »', async () => {
    const api = fakeApi()
    const { code, logs } = await run(api)
    expect(code).toBe(0)
    const writes = api.calls.filter((call) => call.method === 'POST')
    expect(writes.map((call) => call.path)).toEqual([
      'settings?on_conflict=id',
      'prices?on_conflict=key',
      'photos?on_conflict=key',
      'rooms?on_conflict=id',
      'pages_seo?on_conflict=path',
      'list_items',
      'faqs',
      'content_snapshots',
    ])
    expect(api.calls.some((call) => call.method === 'DELETE')).toBe(false)
    const snapshot = writes.at(-1).body[0]
    expect(snapshot).toEqual({ label: 'Import initial', created_by: null, payload: { ...content, version: null } })
    expect(writes.find((call) => call.path === 'faqs').body.every((row) => !('id' in row))).toBe(true)
    expect(logs.join('\n')).not.toContain(SECRET)
  })

  it('refuse sans rien écrire quand une table de contenu contient déjà des lignes', async () => {
    const api = fakeApi({ counts: { content_snapshots: 3 } })
    const { code, logs } = await run(api)
    expect(code).toBe(1)
    expect(api.calls.every((call) => call.method === 'GET')).toBe(true)
    expect(logs.join('\n')).toContain('content_snapshots (3)')
    expect(logs.join('\n')).toContain('--force')
  })

  it('--force vide les tables du site (jamais content_snapshots) avant de réinsérer', async () => {
    const api = fakeApi({ counts: { faqs: 9 } })
    const { code, logs } = await run(api, { argv: ['--force'] })
    expect(code).toBe(0)
    const deletes = api.calls.filter((call) => call.method === 'DELETE').map((call) => call.path.split('?')[0])
    expect(deletes).toEqual(['photo_slots', 'texts', 'list_items', 'faqs', 'rooms', 'pages_seo', 'photos', 'prices', 'settings'])
    expect(api.calls.some((call) => call.path.startsWith('content_snapshots') && call.method === 'DELETE')).toBe(false)
    expect(api.calls.findIndex((call) => call.method === 'POST')).toBeGreaterThan(api.calls.findLastIndex((call) => call.method === 'DELETE'))
    expect(logs.join('\n')).not.toContain(SECRET)
  })

  it('refuse une base non locale sans --i-know-this-is-not-local, sans aucun appel réseau', async () => {
    const api = fakeApi()
    const env = { SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_SERVICE_ROLE_KEY: SECRET }
    const { code, logs } = await run(api, { env, argv: ['--force'] })
    expect(code).toBe(1)
    expect(api.calls).toHaveLength(0)
    expect(logs.join('\n')).toContain('abc.supabase.co')
    expect(logs.join('\n')).not.toContain(SECRET)
  })

  it('refuse quand l’adresse ou la clé manque, sans appel réseau', async () => {
    const api = fakeApi()
    expect((await run(api, { env: { SUPABASE_URL: URL_LOCAL } })).code).toBe(1)
    expect((await run(api, { env: { SUPABASE_SERVICE_ROLE_KEY: SECRET } })).code).toBe(1)
    expect(api.calls).toHaveLength(0)
  })

  it('refuse un seed invalide avant toute écriture', async () => {
    const api = fakeApi()
    const logs = []
    const code = await runSeed({
      content: { ...content, prices: [] },
      env: { SUPABASE_URL: URL_LOCAL, SUPABASE_SERVICE_ROLE_KEY: SECRET },
      argv: [],
      fetchImpl: api.fetchImpl,
      log: (message) => logs.push(message),
    })
    expect(code).toBe(1)
    expect(api.calls).toHaveLength(0)
  })

  it('s’arrête sur une erreur de la base, sans publier d’instantané, et sans afficher la clé', async () => {
    const api = fakeApi({ failOn: 'POST rooms' })
    const { code, logs } = await run(api)
    expect(code).toBe(1)
    expect(api.calls.some((call) => call.path === 'content_snapshots' && call.method === 'POST')).toBe(false)
    expect(logs.join('\n')).toContain('rooms')
    expect(logs.join('\n')).not.toContain(SECRET)
  })
})
