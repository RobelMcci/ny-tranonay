import { describe, expect, it, vi } from 'vitest'
import { handle } from '../functions/publish.mjs'

const SUPABASE_URL = 'https://projet.supabase.test'
const ANON = 'ANON-SENTINEL-KEY'
const HOOK = 'https://api.netlify.test/build_hooks/HOOK-SENTINEL'
const JWT = 'header.JWT-SENTINEL.signature'
const UUID = '3f1c2a9e-7b4d-4c8a-9e21-5d6f0a1b2c3d'
const ENV = { SUPABASE_URL, SUPABASE_ANON_KEY: ANON, BUILD_HOOK_URL: HOOK }

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** `fetchImpl` simulé : enregistre les appels, répond selon `routes` (clé = fin d'URL ou URL complète du hook). */
function fakeFetch(routes) {
  const calls = []
  const impl = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    const route = Object.entries(routes).find(([suffix]) => String(url).endsWith(suffix))
    if (!route) throw new Error('appel inattendu')
    const result = route[1]
    if (result instanceof Error) throw result
    return typeof result === 'function' ? result(url, init) : result
  }
  return { impl, calls }
}

const request = (body, { method = 'POST', auth = `Bearer ${JWT}`, raw } = {}) =>
  new Request('https://site.test/.netlify/functions/publish', {
    method,
    headers: { ...(auth ? { Authorization: auth } : {}), 'Content-Type': 'application/json' },
    ...(method === 'GET' || method === 'HEAD' ? {} : { body: raw ?? JSON.stringify(body) }),
  })

const run = (req, routes, env = ENV) => {
  const fake = fakeFetch(routes)
  return handle(req, { env, fetchImpl: fake.impl }).then(async (response) => ({
    response,
    text: await response.clone().text(),
    body: await response.clone().json().catch(() => null),
    calls: fake.calls,
  }))
}

const hookOk = { [HOOK]: new Response(null, { status: 200 }) }
const noLeak = (text) => {
  for (const secret of [JWT, 'JWT-SENTINEL', ANON, HOOK, 'HOOK-SENTINEL']) expect(text).not.toContain(secret)
}

describe('publish function', () => {
  it('401 sans Authorization, sans aucun appel réseau', async () => {
    for (const auth of [null, '', 'Basic abc', 'Bearer', 'Bearer ', 'Bearer a b']) {
      const { response, body, calls } = await run(request({ action: 'publish' }, { auth }), {})
      expect(response.status).toBe(401)
      expect(body).toEqual({ error: 'unauthorized' })
      expect(calls).toHaveLength(0)
    }
  })

  it('405 hors POST, avec Allow', async () => {
    const { response, calls } = await run(request(null, { method: 'GET' }), {})
    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
    expect(calls).toHaveLength(0)
  })

  it('publish : appelle la RPC avec le jeton de l’utilisateur et la clé anonyme, puis le build hook', async () => {
    const { response, body, calls, text } = await run(request({ action: 'publish', label: '  Ma version  ' }), {
      '/rest/v1/rpc/publish_content': json(UUID),
      ...hookOk,
    })
    expect(response.status).toBe(200)
    expect(body).toEqual({ snapshotId: UUID })
    expect(calls).toHaveLength(2)
    expect(calls[0].url).toBe(`${SUPABASE_URL}/rest/v1/rpc/publish_content`)
    expect(calls[0].init.method).toBe('POST')
    expect(calls[0].init.headers).toEqual({ apikey: ANON, Authorization: `Bearer ${JWT}`, 'Content-Type': 'application/json' })
    expect(JSON.parse(calls[0].init.body)).toEqual({ p_label: 'Ma version' })
    expect(calls[0].init.signal).toBeInstanceOf(AbortSignal)
    expect(calls[1].url).toBe(HOOK)
    expect(calls[1].init.method).toBe('POST')
    expect(calls[1].init.body).toBeUndefined()
    expect(calls[1].init.signal).toBeInstanceOf(AbortSignal)
    noLeak(text)
  })

  it('réponses en JSON, sans cache, sans CORS', async () => {
    const { response } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json(UUID), ...hookOk })
    expect(response.headers.get('Content-Type')).toMatch(/^application\/json/)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('étiquette absente : libellé par défaut en français, fuseau de Madagascar', async () => {
    const { calls } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json(UUID), ...hookOk })
    const { p_label: label } = JSON.parse(calls[0].init.body)
    expect(label).toMatch(/^Publication du \d{1,2} (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4} à \d{2}:\d{2}$/)
  })

  it('étiquette trop longue ou non textuelle : ignorée (libellé par défaut)', async () => {
    for (const label of ['x'.repeat(61), 42, ['a'], '   ', '\u0000\u0007']) {
      const { calls } = await run(request({ action: 'publish', label }), { '/rest/v1/rpc/publish_content': json(UUID), ...hookOk })
      expect(JSON.parse(calls[0].init.body).p_label).toMatch(/^Publication du /)
    }
    const { calls } = await run(request({ action: 'publish', label: 'x'.repeat(60) }), { '/rest/v1/rpc/publish_content': json(UUID), ...hookOk })
    expect(JSON.parse(calls[0].init.body).p_label).toBe('x'.repeat(60))
  })

  it('retire les caractères de contrôle de l’étiquette', async () => {
    const { calls } = await run(request({ action: 'publish', label: 'Été\u0000 2026\n' }), { '/rest/v1/rpc/publish_content': json(UUID), ...hookOk })
    expect(JSON.parse(calls[0].init.body).p_label).toBe('Été 2026')
  })

  it('la RPC répond 403 : 403 et AUCUN appel au build hook', async () => {
    const { response, body, calls, text } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json({ message: 'x' }, 403), ...hookOk })
    expect(response.status).toBe(403)
    expect(body).toEqual({ error: 'forbidden' })
    expect(calls).toHaveLength(1)
    noLeak(text)
  })

  it('la RPC répond 401 : 403 sans build hook', async () => {
    const { response, calls } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json({ message: 'JWT expired' }, 401), ...hookOk })
    expect(response.status).toBe(403)
    expect(calls).toHaveLength(1)
  })

  it('un corps PostgREST 42501 / forbidden : 403 sans build hook', async () => {
    for (const payload of [{ code: '42501', message: 'whatever' }, { message: 'forbidden' }]) {
      const { response, body, calls } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json(payload, 400), ...hookOk })
      expect(response.status).toBe(403)
      expect(body).toEqual({ error: 'forbidden' })
      expect(calls).toHaveLength(1)
    }
  })

  it('autre 4xx : 422 avec un message français choisi, jamais le texte SQL', async () => {
    const { response, body, calls, text } = await run(request({ action: 'publish' }), {
      '/rest/v1/rpc/publish_content': json({ code: 'P0001', message: 'settings missing' }, 400),
      ...hookOk,
    })
    expect(response.status).toBe(422)
    expect(body.error).toBe('rejected')
    expect(body.message).toMatch(/informations/i)
    expect(text).not.toContain('settings missing')
    expect(calls).toHaveLength(1)
  })

  it('restore : instantané inconnu → 422 en français', async () => {
    const { response, body, text } = await run(request({ action: 'restore', snapshotId: UUID }), {
      '/rest/v1/rpc/restore_snapshot': json({ code: 'P0002', message: `snapshot ${UUID} not found` }, 404),
      ...hookOk,
    })
    expect(response.status).toBe(422)
    expect(body.error).toBe('rejected')
    expect(body.message).toMatch(/introuvable/i)
    expect(text).not.toContain('not found')
  })

  it('PostgREST renvoie P0002 avec un statut 500 : introuvable (422), pas une panne', async () => {
    const { response, body, text } = await run(request({ action: 'restore', snapshotId: UUID }), {
      '/rest/v1/rpc/restore_snapshot': json({ code: 'P0002', details: null, hint: null, message: `snapshot ${UUID} not found` }, 500),
      ...hookOk,
    })
    expect(response.status).toBe(422)
    expect(body.error).toBe('rejected')
    expect(body.message).toMatch(/introuvable/i)
    expect(text).not.toContain('not found')
  })

  it('RPC 5xx : 502 et aucun build hook', async () => {
    const { response, body, calls, text } = await run(request({ action: 'publish' }), {
      '/rest/v1/rpc/publish_content': json({ message: 'boom with secret details' }, 500),
      ...hookOk,
    })
    expect(response.status).toBe(502)
    expect(body).toEqual({ error: 'upstream' })
    expect(calls).toHaveLength(1)
    expect(text).not.toContain('boom')
  })

  it('RPC injoignable ou en dépassement de délai : 502', async () => {
    for (const failure of [new TypeError('fetch failed'), new DOMException('timed out', 'TimeoutError')]) {
      const { response, body, calls, text } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': failure, ...hookOk })
      expect(response.status).toBe(502)
      expect(body).toEqual({ error: 'upstream' })
      expect(calls).toHaveLength(1)
      noLeak(text)
    }
  })

  it('réponse de la RPC qui n’est pas un uuid : 502', async () => {
    const { response, calls } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json({ pas: 'un uuid' }), ...hookOk })
    expect(response.status).toBe(502)
    expect(calls).toHaveLength(1)
  })

  it('build hook en échec (non 2xx ou réseau) : 502 avec le snapshotId, version conservée', async () => {
    for (const hook of [new Response('nope', { status: 500 }), new TypeError('network down'), new DOMException('timed out', 'TimeoutError')]) {
      const { response, body, text } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json(UUID), [HOOK]: hook })
      expect(response.status).toBe(502)
      expect(body).toEqual({ error: 'build_hook_failed', snapshotId: UUID })
      noLeak(text)
    }
  })

  it('restore : appelle rpc/restore_snapshot avec p_id puis le build hook', async () => {
    const NEW_ID = '9a8b7c6d-1e2f-4a3b-8c4d-5e6f7a8b9c0d'
    const { response, body, calls } = await run(request({ action: 'restore', snapshotId: UUID }), { '/rest/v1/rpc/restore_snapshot': json(NEW_ID), ...hookOk })
    expect(response.status).toBe(200)
    expect(body).toEqual({ snapshotId: NEW_ID })
    expect(calls[0].url).toBe(`${SUPABASE_URL}/rest/v1/rpc/restore_snapshot`)
    expect(calls[0].init.headers).toEqual({ apikey: ANON, Authorization: `Bearer ${JWT}`, 'Content-Type': 'application/json' })
    expect(JSON.parse(calls[0].init.body)).toEqual({ p_id: UUID })
    expect(calls[1].url).toBe(HOOK)
  })

  it('restore : identifiant invalide → 400 sans aucun appel', async () => {
    for (const snapshotId of ['pas-un-uuid', '', 42, null, `${UUID}; drop table x`, undefined]) {
      const { response, body, calls } = await run(request({ action: 'restore', snapshotId }), {})
      expect(response.status).toBe(400)
      expect(body).toEqual({ error: 'bad_request' })
      expect(calls).toHaveLength(0)
    }
  })

  it('rebuild : is_admin vrai → build hook, aucun instantané créé', async () => {
    const { response, body, calls } = await run(request({ action: 'rebuild' }), { '/rest/v1/rpc/is_admin': json(true), ...hookOk })
    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(calls).toHaveLength(2)
    expect(calls[0].url).toBe(`${SUPABASE_URL}/rest/v1/rpc/is_admin`)
    expect(calls[0].init.headers).toEqual({ apikey: ANON, Authorization: `Bearer ${JWT}`, 'Content-Type': 'application/json' })
    expect(JSON.parse(calls[0].init.body)).toEqual({})
    expect(calls[1].url).toBe(HOOK)
  })

  it('rebuild : is_admin faux ou non booléen → 403 sans build hook', async () => {
    for (const result of [json(false), json('true'), json(null)]) {
      const { response, body, calls } = await run(request({ action: 'rebuild' }), { '/rest/v1/rpc/is_admin': result, ...hookOk })
      expect(response.status).toBe(403)
      expect(body).toEqual({ error: 'forbidden' })
      expect(calls).toHaveLength(1)
    }
  })

  it('rebuild : build hook en échec → 502 sans snapshotId', async () => {
    const { response, body } = await run(request({ action: 'rebuild' }), { '/rest/v1/rpc/is_admin': json(true), [HOOK]: new Response('x', { status: 502 }) })
    expect(response.status).toBe(502)
    expect(body).toEqual({ error: 'build_hook_failed' })
  })

  it('rebuild : is_admin en erreur serveur → 502', async () => {
    const { response, calls } = await run(request({ action: 'rebuild' }), { '/rest/v1/rpc/is_admin': json({}, 500), ...hookOk })
    expect(response.status).toBe(502)
    expect(calls).toHaveLength(1)
  })

  it('corps invalide, action inconnue ou corps non objet : 400 sans appel', async () => {
    for (const raw of ['pas du json', '', '[]', 'null', '"publish"', JSON.stringify({ action: 'drop' }), JSON.stringify({}), JSON.stringify({ action: 42 })]) {
      const { response, body, calls } = await run(request(null, { raw }), {})
      expect(response.status).toBe(400)
      expect(body).toEqual({ error: 'bad_request' })
      expect(calls).toHaveLength(0)
    }
  })

  it('configuration incomplète : 500 sans fuite, sans appel', async () => {
    for (const missing of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'BUILD_HOOK_URL']) {
      const env = { ...ENV, [missing]: '' }
      const { response, body, calls, text } = await run(request({ action: 'publish' }), {}, env)
      expect(response.status).toBe(500)
      expect(body).toEqual({ error: 'configuration' })
      expect(calls).toHaveLength(0)
      expect(text).not.toContain(missing)
      noLeak(text)
    }
  })

  it('la configuration est vérifiée après la méthode et le jeton', async () => {
    expect((await run(request(null, { method: 'GET' }), {}, {})).response.status).toBe(405)
    expect((await run(request({ action: 'publish' }, { auth: null }), {}, {})).response.status).toBe(401)
  })

  it('ne journalise rien', async () => {
    const original = { log: console.log, info: console.info, warn: console.warn, error: console.error }
    const seen = []
    for (const key of Object.keys(original)) console[key] = (...args) => seen.push(args)
    try {
      await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json({ message: 'boom' }, 500), ...hookOk })
      await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': new TypeError('x'), ...hookOk })
    } finally {
      Object.assign(console, original)
    }
    expect(seen).toEqual([])
  })

  it('schéma Bearer insensible à la casse, mais jamais de jeton vide, d’espace ou de saut de ligne', async () => {
    const routes = () => ({ '/rest/v1/rpc/publish_content': json(UUID), ...hookOk, [HOOK]: new Response(null, { status: 200 }) })
    for (const scheme of ['bearer', 'BEARER', 'BeArEr']) {
      const { response, calls } = await run(request({ action: 'publish' }, { auth: `${scheme} ${JWT}` }), routes())
      expect(response.status).toBe(200)
      expect(calls[0].init.headers.Authorization).toBe(`Bearer ${JWT}`)
    }
    for (const auth of ['Bearer  two-spaces', 'bearer', 'bearer ', 'Bearer a\nb', 'Bearer a\r\nX: y', ' Bearer abc']) {
      const fake = fakeFetch(routes())
      const response = await handle({ method: 'POST', headers: { get: () => auth }, text: async () => '{"action":"publish"}' }, { env: ENV, fetchImpl: fake.impl })
      expect(response.status).toBe(401)
      expect(fake.calls).toHaveLength(0)
    }
  })

  it('corps trop volumineux : 400 sans appel', async () => {
    const { response, body, calls } = await run(request({ action: 'publish', label: 'x'.repeat(5000) }), { '/rest/v1/rpc/publish_content': json(UUID), ...hookOk })
    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'bad_request' })
    expect(calls).toHaveLength(0)
  })

  it('408 et 429 de la RPC : 502 (côté Supabase), sans build hook', async () => {
    for (const status of [408, 429]) {
      const { response, body, calls } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json({ message: 'slow down' }, status), ...hookOk })
      expect(response.status).toBe(502)
      expect(body).toEqual({ error: 'upstream' })
      expect(calls).toHaveLength(1)
    }
  })

  it('erreur métier inconnue (P0001 avec un autre texte) : 422 générique en français', async () => {
    const { response, body, text } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json({ code: 'P0001', message: 'something odd' }, 400), ...hookOk })
    expect(response.status).toBe(422)
    expect(body.error).toBe('rejected')
    expect(body.message).toMatch(/refusée/)
    expect(text).not.toContain('odd')
  })

  it('« introuvable » seulement pour restore : 404 / PGRST202 / P0002 ailleurs = 502', async () => {
    const cases = [
      [{ action: 'publish' }, '/rest/v1/rpc/publish_content', json({ code: 'PGRST202', message: 'Could not find the function' }, 404)],
      [{ action: 'publish' }, '/rest/v1/rpc/publish_content', json({ message: 'nope' }, 404)],
      [{ action: 'publish' }, '/rest/v1/rpc/publish_content', json({ code: 'P0002', message: 'x' }, 500)],
      [{ action: 'rebuild' }, '/rest/v1/rpc/is_admin', json({ code: 'PGRST202', message: 'x' }, 404)],
      [{ action: 'restore', snapshotId: UUID }, '/rest/v1/rpc/restore_snapshot', json({ code: 'PGRST202', message: 'Could not find the function' }, 404)],
    ]
    for (const [input, route, result] of cases) {
      const { response, body, calls } = await run(request(input), { [route]: result, ...hookOk })
      expect(response.status).toBe(502)
      expect(body).toEqual({ error: 'upstream' })
      expect(calls).toHaveLength(1)
    }
  })

  it('restore : 404 ou 22P02 sans code PGRST → 422 « introuvable »', async () => {
    for (const result of [json({ message: 'gone' }, 404), json({ code: '22P02', message: 'invalid input syntax for type uuid' }, 400)]) {
      const { response, body, calls } = await run(request({ action: 'restore', snapshotId: UUID }), { '/rest/v1/rpc/restore_snapshot': result, ...hookOk })
      expect(response.status).toBe(422)
      expect(body.message).toMatch(/introuvable/i)
      expect(calls).toHaveLength(1)
    }
  })

  it('adresses de configuration invalides (hors http/https) : 500 configuration', async () => {
    for (const env of [{ ...ENV, SUPABASE_URL: 'projet.supabase.test' }, { ...ENV, SUPABASE_URL: 'ftp://x.test' }, { ...ENV, BUILD_HOOK_URL: 'javascript:alert(1)' }, { ...ENV, BUILD_HOOK_URL: 'pas une url' }]) {
      const { response, body, calls } = await run(request({ action: 'publish' }), {}, env)
      expect(response.status).toBe(500)
      expect(body).toEqual({ error: 'configuration' })
      expect(calls).toHaveLength(0)
    }
  })

  it('chaque appel sortant (RPC puis build hook) reçoit un délai de 10 s', async () => {
    const created = []
    const spy = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      const signal = new AbortController().signal
      created.push(signal)
      return signal
    })
    try {
      const { calls } = await run(request({ action: 'publish' }), { '/rest/v1/rpc/publish_content': json(UUID), ...hookOk })
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls).toEqual([[10000], [10000]])
      expect(calls[0].init.signal).toBe(created[0])
      expect(calls[1].init.signal).toBe(created[1])
      expect(calls.every((call) => call.init.signal.aborted === false)).toBe(true)
    } finally {
      spy.mockRestore()
    }
  })
})
