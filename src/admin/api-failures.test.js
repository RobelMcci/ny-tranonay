import { beforeEach, describe, expect, it, vi } from 'vitest'

// Faux client Supabase dont chaque requête renvoie `state.response` : sert à vérifier les messages d'erreur.
const state = vi.hoisted(() => ({ response: { data: null, error: null } }))

vi.mock('./supabase.js', () => {
  const builder = () => {
    const b = {}
    for (const method of ['select', 'order', 'limit', 'eq', 'upsert', 'update']) b[method] = () => b
    b.maybeSingle = () => b
    b.then = (resolve, reject) => Promise.resolve(state.response).then(resolve, reject)
    return b
  }
  return { getSupabase: () => ({ rpc: () => builder(), from: () => builder() }) }
})

const api = await import('./api.js')

const settings = { name: 'Tranonay' }
const calls = [
  ['fetchDraft', () => api.fetchDraft(), 'Impossible de charger le brouillon.'],
  ['fetchPublished', () => api.fetchPublished(), 'Impossible de charger la version publiée.'],
  ['loadSettings', () => api.loadSettings(), 'Impossible de charger les informations.'],
  ['saveSettings', () => api.saveSettings(settings), 'Impossible d’enregistrer les informations.'],
  ['loadPrices', () => api.loadPrices(), 'Impossible de charger les tarifs.'],
  ['savePrices', () => api.savePrices([{ key: 'reception_jour', amount: 1, label: 'Réception' }]), 'Impossible d’enregistrer le tarif « Réception ».'],
]

const rejection = async (fn) => {
  try {
    await fn()
  } catch (error) {
    return error
  }
  throw new Error('aucune erreur')
}

beforeEach(() => {
  state.response = { data: null, error: null }
})

describe('messages d’erreur entièrement en français (jamais le texte anglais de Supabase)', () => {
  it.each(calls)('%s : action seule pour une erreur inconnue', async (_name, fn, action) => {
    state.response = { data: null, error: { message: 'unexpected internal error XX', code: 'XX000' } }
    const error = await rejection(fn)
    expect(error.message).toBe(action)
    expect(error.message).not.toMatch(/unexpected|internal/i)
  })

  it.each(calls)('%s : cause traduite (droits, réseau)', async (_name, fn, action) => {
    state.response = { data: null, error: { message: 'permission denied for table settings', code: '42501' } }
    expect((await rejection(fn)).message).toBe(`${action} Vous n’avez pas les droits nécessaires.`)
    state.response = { data: null, error: { message: 'TypeError: Failed to fetch' } }
    expect((await rejection(fn)).message).toBe(`${action} Connexion impossible. Vérifiez votre connexion internet puis réessayez.`)
  })
})
