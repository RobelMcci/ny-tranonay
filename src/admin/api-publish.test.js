import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const TOKEN = 'header.TOKEN-SENTINEL.signature'
const UUID = '3f1c2a9e-7b4d-4c8a-9e21-5d6f0a1b2c3d'

// Faux client Supabase : session réglable, requêtes `from()` enregistrées.
const state = vi.hoisted(() => ({ session: null, calls: [], response: { data: [], error: null } }))

vi.mock('./supabase.js', () => ({
  getSupabase: () => ({
    auth: { getSession: async () => ({ data: { session: state.session }, error: null }) },
    from: (table) => {
      const builder = {}
      for (const method of ['select', 'order', 'limit']) {
        builder[method] = (...args) => {
          state.calls.push({ name: `${table}.${method}`, args })
          return builder
        }
      }
      builder.then = (resolve, reject) => Promise.resolve(state.response).then(resolve, reject)
      return builder
    },
  }),
}))

const api = await import('./api.js')

const SESSION_EXPIRED = 'Session expirée : reconnectez-vous.'
const NO_RIGHTS = 'Vous n’avez pas les droits nécessaires.'
const HOOK_FAILED = 'La version est enregistrée, mais le lancement de la construction du site a échoué : relancez la construction.'
const BUSY = 'Service momentanément indisponible, réessayez.'
const UNAVAILABLE = 'La publication n’est disponible que sur le site en ligne (ou avec `netlify dev`).'

const answer = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })

let fetchMock
beforeEach(() => {
  state.session = { access_token: TOKEN }
  state.calls = []
  state.response = { data: [], error: null }
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const failure = async (promise) => {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('aurait dû échouer')
}

describe('publishContent', () => {
  it('envoie l’action et le jeton à la fonction, renvoie l’identifiant', async () => {
    fetchMock.mockResolvedValue(answer({ snapshotId: UUID }))
    expect(await api.publishContent('Ma version')).toEqual({ snapshotId: UUID })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/.netlify/functions/publish')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({ action: 'publish', label: 'Ma version' })
  })

  it('n’envoie pas d’étiquette vide', async () => {
    fetchMock.mockImplementation(async () => answer({ snapshotId: UUID }))
    await api.publishContent('   ')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'publish' })
    await api.publishContent()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ action: 'publish' })
  })

  it('sans session : « Session expirée » et aucun appel', async () => {
    state.session = null
    expect((await failure(api.publishContent())).message).toBe(SESSION_EXPIRED)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('traduit chaque réponse d’erreur en français', async () => {
    const cases = [
      [answer({ error: 'unauthorized' }, 401), SESSION_EXPIRED],
      [answer({ error: 'forbidden' }, 403), NO_RIGHTS],
      [answer({ error: 'rejected', message: 'Cette version est introuvable : rechargez la page.' }, 422), 'Cette version est introuvable : rechargez la page.'],
      [answer({ error: 'upstream' }, 502), BUSY],
      [answer({ error: 'configuration' }, 500), BUSY],
      [answer({ error: 'bad_request' }, 400), BUSY],
      [answer('<html>', 404), UNAVAILABLE],
      [answer('', 405), UNAVAILABLE],
      [answer('<html>pas du json</html>', 200), UNAVAILABLE],
    ]
    for (const [response, message] of cases) {
      fetchMock.mockResolvedValueOnce(response)
      const error = await failure(api.publishContent())
      expect(error.message).toBe(message)
      expect(error.message).not.toContain(TOKEN)
    }
  })

  it('422 sans message : message générique, jamais de texte brut inattendu', async () => {
    fetchMock.mockResolvedValue(answer({ error: 'rejected' }, 422))
    expect((await failure(api.publishContent())).message).toBe(BUSY)
  })

  it('panne réseau (fetch rejeté) : « réessayez », pas « disponible que sur le site en ligne »', async () => {
    for (const reason of [new TypeError('Failed to fetch'), new TypeError('NetworkError when attempting to fetch resource.'), new Error('Load failed')]) {
      fetchMock.mockRejectedValueOnce(reason)
      const error = await failure(api.publishContent())
      expect(error.message).toBe(BUSY)
      expect(error.rejected).toBeUndefined()
    }
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect((await failure(api.rebuildSite())).message).toBe(BUSY)
  })

  it('build hook en échec : message explicite et identifiant de la version conservée', async () => {
    fetchMock.mockResolvedValue(answer({ error: 'build_hook_failed', snapshotId: UUID }, 502))
    const error = await failure(api.publishContent())
    expect(error.message).toBe(HOOK_FAILED)
    expect(error.snapshotId).toBe(UUID)
    expect(error.code).toBe('build_hook_failed')
  })

  it('succès sans identifiant : erreur (pas de faux succès)', async () => {
    fetchMock.mockResolvedValue(answer({}))
    expect((await failure(api.publishContent())).message).toBe(BUSY)
  })
})

describe('erreurs « refusées » (rien n’a pu être enregistré) ou incertaines', () => {
  it('401, 403, 422 avec message et absence de session portent `rejected` : l’état de la base n’a pas changé', async () => {
    state.session = null
    expect((await failure(api.publishContent())).rejected).toBe(true)
    state.session = { access_token: TOKEN }
    for (const response of [answer({ error: 'unauthorized' }, 401), answer({ error: 'forbidden' }, 403), answer({ error: 'rejected', message: 'Cette version est introuvable : rechargez la page.' }, 422)]) {
      fetchMock.mockResolvedValueOnce(response)
      expect((await failure(api.publishContent())).rejected).toBe(true)
    }
  })

  it('5xx, panne réseau, non-JSON et échec du build hook ne portent PAS `rejected` : la version a pu être enregistrée', async () => {
    for (const response of [answer({ error: 'upstream' }, 502), answer('<html>Gateway Timeout</html>', 504), answer({ error: 'build_hook_failed', snapshotId: UUID }, 502), answer({ error: 'configuration' }, 500)]) {
      fetchMock.mockResolvedValueOnce(response)
      expect((await failure(api.publishContent())).rejected).toBeUndefined()
    }
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect((await failure(api.restoreSnapshot(UUID))).rejected).toBeUndefined()
  })
})

describe('restoreSnapshot', () => {
  it('envoie l’identifiant de l’instantané à restaurer', async () => {
    fetchMock.mockResolvedValue(answer({ snapshotId: 'new-id' }))
    expect(await api.restoreSnapshot(UUID)).toEqual({ snapshotId: 'new-id' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'restore', snapshotId: UUID })
  })

  it('expose l’identifiant quand la construction n’a pas pu être lancée', async () => {
    fetchMock.mockResolvedValue(answer({ error: 'build_hook_failed', snapshotId: 'new-id' }, 502))
    const error = await failure(api.restoreSnapshot(UUID))
    expect(error.snapshotId).toBe('new-id')
    expect(error.message).toBe(HOOK_FAILED)
  })
})

describe('rebuildSite', () => {
  it('demande la reconstruction sans créer de version', async () => {
    fetchMock.mockResolvedValue(answer({ ok: true }))
    await api.rebuildSite()
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'rebuild' })
  })

  it('échec du lancement : message sans identifiant de version', async () => {
    fetchMock.mockResolvedValue(answer({ error: 'build_hook_failed' }, 502))
    const error = await failure(api.rebuildSite())
    expect(error.message).toBe('Le lancement de la construction du site a échoué : réessayez.')
    expect(error.snapshotId).toBeUndefined()
  })

  it('droits insuffisants', async () => {
    fetchMock.mockResolvedValue(answer({ error: 'forbidden' }, 403))
    expect((await failure(api.rebuildSite())).message).toBe(NO_RIGHTS)
  })
})

describe('fetchHistory', () => {
  it('lit les instantanés SANS le contenu, du plus récent au plus ancien', async () => {
    const rows = [{ id: 'b', created_at: '2026-10-29T10:00:00Z', label: 'Deux' }]
    state.response = { data: rows, error: null }
    expect(await api.fetchHistory()).toEqual(rows)
    expect(state.calls).toEqual([
      { name: 'content_snapshots.select', args: ['id, created_at, label'] },
      { name: 'content_snapshots.order', args: ['created_at', { ascending: false }] },
      { name: 'content_snapshots.limit', args: [20] },
    ])
  })

  it('accepte une autre limite et renvoie [] sans ligne', async () => {
    state.response = { data: null, error: null }
    expect(await api.fetchHistory(5)).toEqual([])
    expect(state.calls.at(-1)).toEqual({ name: 'content_snapshots.limit', args: [5] })
  })

  it('erreur Supabase : message français', async () => {
    state.response = { data: null, error: { message: 'boom', code: 'XX000' } }
    const error = await failure(api.fetchHistory())
    expect(error.message).toBe('Impossible de charger l’historique.')
  })
})

describe('fetchBuildVersion', () => {
  it('lit /version.json sans cache et renvoie la version', async () => {
    fetchMock.mockResolvedValue(answer({ snapshot: UUID, builtAt: '2026-10-29T10:00:00Z' }))
    expect(await api.fetchBuildVersion()).toBe(UUID)
    expect(fetchMock).toHaveBeenCalledWith('/version.json', { cache: 'no-store' })
  })

  it('renvoie null pour une erreur, un JSON invalide ou une forme inattendue', async () => {
    fetchMock.mockResolvedValueOnce(answer('', 404))
    expect(await api.fetchBuildVersion()).toBeNull()
    fetchMock.mockResolvedValueOnce(answer('<html></html>'))
    expect(await api.fetchBuildVersion()).toBeNull()
    fetchMock.mockResolvedValueOnce(answer({ snapshot: 42 }))
    expect(await api.fetchBuildVersion()).toBeNull()
    fetchMock.mockResolvedValueOnce(answer(null))
    expect(await api.fetchBuildVersion()).toBeNull()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await api.fetchBuildVersion()).toBeNull()
  })
})
