// Écrit src/data/content.snapshot.json : contenu publié (Supabase) ou, à défaut, seed commité.
// Usage : node scripts/fetch-content.mjs [--seed]   (--seed : seed sans réseau, utilisé par `pretest`)
// Ne fait jamais échouer le build : toute erreur de chargement se replie sur le seed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadContent } from './lib/content-loader.mjs'
import { syncPhotos } from './lib/sync-photos.mjs'

const root = new URL('../', import.meta.url)
const seedPath = fileURLToPath(new URL('src/data/content.seed.json', root))
const snapshotPath = fileURLToPath(new URL('src/data/content.snapshot.json', root))
const envLocalPath = fileURLToPath(new URL('.env.local', root))
const cmsDir = fileURLToPath(new URL('src/assets/cms', root))

// Mini-parseur .env.local (KEY=VALUE, commentaires #, guillemets optionnels) ; n'écrase pas l'environnement.
function loadEnvLocal(env) {
  if (!existsSync(envLocalPath)) return
  for (const raw of readFileSync(envLocalPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.replace(/^export\s+/, '').match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) continue
    const [, key, rest] = match
    let value = rest.trim()
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1)
    else value = value.replace(/\s+#.*$/, '')
    if (env[key] === undefined) env[key] = value
  }
}

const readSeed = () => JSON.parse(readFileSync(seedPath, 'utf8'))
const useSeedOnly = process.argv.includes('--seed')

let result
if (useSeedOnly) {
  result = { content: readSeed(), source: 'seed' }
} else {
  const env = { ...process.env }
  loadEnvLocal(env)
  try {
    result = await loadContent({ env, fetchImpl: fetch, readSeed, log: console.warn })
  } catch (error) {
    console.warn(`contenu : erreur inattendue (${error?.message ?? error}), repli sur le seed`)
    result = { content: readSeed(), source: 'seed' }
  }
  // Télécharge les photos téléversées (Storage) dans src/assets/cms ; celles qui échouent sont retirées du contenu.
  try {
    if (result.content.photos?.some((photo) => !photo.file && photo.storagePath)) mkdirSync(cmsDir, { recursive: true })
    result = {
      ...result,
      content: await syncPhotos(result.content, {
        fetchImpl: fetch,
        env,
        dir: cmsDir,
        writeFile: (path, data) => writeFileSync(path, data),
        log: console.warn,
      }),
    }
  } catch (error) {
    console.warn(`photos : erreur inattendue (${error?.message ?? error}), repli sur le seed`)
    result = { content: readSeed(), source: 'seed' }
  }
}

writeFileSync(snapshotPath, `${JSON.stringify(result.content, null, 2)}\n`)
console.log(`contenu : ${result.source} (${result.content.version ?? 'seed'})`)
