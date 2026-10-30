import { beforeEach, describe, expect, it, vi } from 'vitest'

// Faux client Supabase : chaque appel est enregistré dans `calls`, la réponse de chaque opération est réglée par test.
const state = vi.hoisted(() => ({ calls: [], responses: {} }))

vi.mock('./supabase.js', () => ({
  getSupabase: () => ({
    from: (table) => {
      let operation = 'select'
      const builder = {}
      for (const method of ['select', 'order', 'in', 'eq']) {
        builder[method] = (...args) => {
          state.calls.push({ name: `${table}.${method}`, args })
          return builder
        }
      }
      for (const method of ['upsert', 'delete']) {
        builder[method] = (...args) => {
          operation = method
          state.calls.push({ name: `${table}.${method}`, args })
          return builder
        }
      }
      builder.then = (resolve, reject) => Promise.resolve(state.responses[operation] ?? { data: [], error: null }).then(resolve, reject)
      return builder
    },
  }),
}))

const api = await import('./api.js')

const names = () => state.calls.map((call) => call.name)

beforeEach(() => {
  state.calls = []
  state.responses = {}
})

describe('loadTexts', () => {
  it('convertit les lignes en objet clé → valeur', async () => {
    state.responses.select = { data: [{ key: 'a.titre', value: 'T' }, { key: 'a.texte', value: 'X' }], error: null }
    expect(await api.loadTexts()).toEqual({ 'a.titre': 'T', 'a.texte': 'X' })
    expect(names()[0]).toBe('texts.select')
  })

  it('renvoie un objet vide sans ligne', async () => {
    state.responses.select = { data: null, error: null }
    expect(await api.loadTexts()).toEqual({})
  })

  it('échoue en français', async () => {
    state.responses.select = { data: null, error: { message: 'Failed to fetch' } }
    await expect(api.loadTexts()).rejects.toThrow(/^Impossible de charger les textes\. Connexion impossible/)
  })
})

describe('saveTexts', () => {
  it('envoie un seul upsert puis une seule suppression', async () => {
    await api.saveTexts({ upserts: [{ key: 'a', value: '1' }, { key: 'b', value: '2' }], deletes: ['c', 'd'] })
    expect(names()).toEqual(['texts.upsert', 'texts.delete', 'texts.in'])
    expect(state.calls[0].args).toEqual([[{ key: 'a', value: '1' }, { key: 'b', value: '2' }], { onConflict: 'key' }])
    expect(state.calls[2].args).toEqual(['key', ['c', 'd']])
  })

  it('saute les requêtes vides', async () => {
    await api.saveTexts({ upserts: [], deletes: [] })
    expect(names()).toEqual([])
    await api.saveTexts({ upserts: [{ key: 'a', value: '1' }], deletes: [] })
    expect(names()).toEqual(['texts.upsert'])
    state.calls = []
    await api.saveTexts({ upserts: [], deletes: ['c'] })
    expect(names()).toEqual(['texts.delete', 'texts.in'])
  })

  it('ne supprime rien si l’enregistrement échoue', async () => {
    state.responses.upsert = { error: { code: '42501', message: 'permission denied' } }
    await expect(api.saveTexts({ upserts: [{ key: 'a', value: '1' }], deletes: ['c'] })).rejects.toThrow('Impossible d’enregistrer les textes. Vous n’avez pas les droits nécessaires.')
    expect(names()).toEqual(['texts.upsert'])
  })

  it('dit quelle partie a réussi si la suppression échoue après l’enregistrement', async () => {
    state.responses.delete = { error: { message: 'boom' } }
    await expect(api.saveTexts({ upserts: [{ key: 'a', value: '1' }], deletes: ['c'] })).rejects.toThrow(
      'Les textes modifiés sont enregistrés, mais le retour au texte d’origine a échoué : réessayez.',
    )
  })

  it('une suppression seule qui échoue donne l’erreur ordinaire', async () => {
    state.responses.delete = { error: { message: 'Failed to fetch' } }
    await expect(api.saveTexts({ upserts: [], deletes: ['c'] })).rejects.toThrow(/^Impossible de rétablir le texte d’origine\. Connexion impossible/)
  })
})
