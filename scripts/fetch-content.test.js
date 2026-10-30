// Câblage du script fetch-content.mjs : en production Netlify, un échec de chargement arrête le build sans rien écrire.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const SNAPSHOT = fileURLToPath(new URL('../src/data/content.snapshot.json', import.meta.url))
const ANON = 'anon-cle-de-test-ne-pas-afficher'

const readSnapshot = () => (existsSync(SNAPSHOT) ? readFileSync(SNAPSHOT, 'utf8') : null)

describe('scripts/fetch-content.mjs', () => {
  it('production Netlify avec Supabase injoignable : code 1, message clair, instantané local inchangé', () => {
    const before = readSnapshot()
    const env = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      NETLIFY: 'true',
      CONTEXT: 'production',
      // Port fermé sur la machine locale : connexion refusée immédiatement.
      SUPABASE_URL: 'http://127.0.0.1:1',
      SUPABASE_ANON_KEY: ANON,
    }
    const run = spawnSync(process.execPath, ['scripts/fetch-content.mjs'], { cwd: ROOT, env, encoding: 'utf8', timeout: 30_000 })

    expect(run.status).toBe(1)
    expect(run.stderr).toMatch(/ÉCHEC du chargement du contenu publié \(Supabase injoignable/)
    expect(run.stderr).toMatch(/le site actuel reste en ligne/)
    expect(run.stderr).toMatch(/CONTENT_ALLOW_SEED_FALLBACK=1/)
    expect(`${run.stdout}${run.stderr}`).not.toContain(ANON)
    expect(readSnapshot()).toBe(before)
  })
})
