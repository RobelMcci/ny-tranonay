import { beforeEach, describe, expect, it, vi } from 'vitest'

// Faux client Supabase : chaque appel est enregistré dans `calls`, la réponse de chaque opération est réglée par test.
const state = vi.hoisted(() => ({ calls: [], responses: {} }))

vi.mock('./supabase.js', () => ({
  getSupabase: () => ({
    from: (table) => {
      let operation = 'select'
      const builder = {}
      for (const method of ['select', 'order', 'eq']) {
        builder[method] = (...args) => {
          state.calls.push({ name: `${table}.${method}`, args })
          return builder
        }
      }
      builder.update = (...args) => {
        operation = 'update'
        state.calls.push({ name: `${table}.update`, args })
        return builder
      }
      builder.then = (resolve, reject) => Promise.resolve(state.responses[operation] ?? { data: [], error: null }).then(resolve, reject)
      return builder
    },
  }),
}))

const api = await import('./api.js')

beforeEach(() => {
  state.calls = []
  state.responses = {}
})

const row = { path: '/chambres', title: 'T', description: 'D', priority: '0.8', nav_label: 'Chambres' }

describe('loadPagesSeo', () => {
  it('trie par position puis par chemin (ordre du menu), jamais par priorité', async () => {
    state.responses.select = { data: [row], error: null }
    expect(await api.loadPagesSeo()).toEqual([{ path: '/chambres', title: 'T', description: 'D', priority: 0.8, navLabel: 'Chambres' }])
    const orders = state.calls.filter((call) => call.name === 'pages_seo.order').map((call) => call.args[0])
    expect(orders).toEqual(['position', 'path'])
  })
})

describe('savePageSeo', () => {
  it('met à jour titre, description, priorité et libellé du menu, sans jamais toucher à la position', async () => {
    state.responses.update = { data: [row], error: null }
    await api.savePageSeo({ path: '/chambres', title: 'T', description: 'D', priority: 0.8, navLabel: 'Chambres', position: 99 })
    const update = state.calls.find((call) => call.name === 'pages_seo.update')
    expect(update.args[0]).toEqual({ title: 'T', description: 'D', priority: 0.8, nav_label: 'Chambres' })
    expect(state.calls.find((call) => call.name === 'pages_seo.eq').args).toEqual(['path', '/chambres'])
  })
})
