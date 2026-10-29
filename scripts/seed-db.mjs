// Importe le contenu actuel du site (src/data/content.seed.json) dans la base Supabase.
// Usage : npm run seed:db [-- --force] [-- --i-know-this-is-not-local]
//   SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY : variables d'environnement ou .env.local (jamais commité).
//   Refuse de s'exécuter si la base contient déjà du contenu, sauf --force ; refuse une base non locale
//   sauf --i-know-this-is-not-local. N'affiche jamais la clé.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal } from './lib/env-local.mjs'
import { runSeed } from './lib/seed-db.mjs'

const root = new URL('../', import.meta.url)
const env = { ...process.env }
loadEnvLocal(env, fileURLToPath(new URL('.env.local', root)))

const content = JSON.parse(readFileSync(fileURLToPath(new URL('src/data/content.seed.json', root)), 'utf8'))

process.exitCode = await runSeed({
  content,
  env,
  argv: process.argv.slice(2),
  fetchImpl: fetch,
  log: (message) => console.log(message),
})
