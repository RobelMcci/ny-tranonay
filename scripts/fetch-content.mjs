// Écrit src/data/content.snapshot.json : contenu publié (Supabase) ou, à défaut, seed commité.
// Usage : node scripts/fetch-content.mjs [--seed]   (--seed : seed sans réseau, utilisé par `pretest`)
//
// Hors production (poste local, aperçus Netlify, variables absentes) : toute erreur de chargement se replie sur le seed.
// En production Netlify (NETLIFY=true, CONTEXT=production, SUPABASE_URL et SUPABASE_ANON_KEY définies) : une erreur
// (Supabase en pause ou injoignable, réponse invalide…) arrête le build (code 1), Netlify garde donc le site actuel en
// ligne au lieu de remettre le contenu d'origine. Seule exception : aucun instantané publié (base vide) → seed.
// Échappatoire : CONTENT_ALLOW_SEED_FALLBACK=1 rétablit le repli sur le seed en production.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { isStrictBuild, loadContent } from './lib/content-loader.mjs'
import { loadEnvLocal } from './lib/env-local.mjs'
import { syncPhotos } from './lib/sync-photos.mjs'

const root = new URL('../', import.meta.url)
const seedPath = fileURLToPath(new URL('src/data/content.seed.json', root))
const snapshotPath = fileURLToPath(new URL('src/data/content.snapshot.json', root))
const envLocalPath = fileURLToPath(new URL('.env.local', root))
const cmsDir = fileURLToPath(new URL('src/assets/cms', root))

const readSeed = () => JSON.parse(readFileSync(seedPath, 'utf8'))
const useSeedOnly = process.argv.includes('--seed')

/** Arrêt du build de production : rien n'est écrit, Netlify garde le déploiement précédent. */
function abortStrict(error) {
  const detail = String(error?.message ?? error).replace(/^contenu : /, '')
  console.error(
    [
      `contenu : ÉCHEC du chargement du contenu publié (${detail}).`,
      'Build de production arrêté pour ne pas remettre en ligne le contenu d’origine (seed) : le site actuel reste en ligne.',
      'Vérifiez que le projet Supabase est actif (pas en pause), puis relancez le déploiement.',
      'Pour construire quand même avec le contenu d’origine : variable CONTENT_ALLOW_SEED_FALLBACK=1.',
    ].join('\n'),
  )
  process.exit(1)
}

let result
if (useSeedOnly) {
  result = { content: readSeed(), source: 'seed' }
} else {
  const env = { ...process.env }
  loadEnvLocal(env, envLocalPath)
  const strict = isStrictBuild(env)
  if (strict) console.log('contenu : production Netlify, mode strict (pas de repli sur le seed en cas d’erreur)')
  try {
    result = await loadContent({ env, fetchImpl: fetch, readSeed, log: console.warn, strict })
  } catch (error) {
    if (strict) abortStrict(error)
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
    if (strict) abortStrict(new Error(`photos : erreur inattendue (${error?.message ?? error})`))
    console.warn(`photos : erreur inattendue (${error?.message ?? error}), repli sur le seed`)
    result = { content: readSeed(), source: 'seed' }
  }
}

writeFileSync(snapshotPath, `${JSON.stringify(result.content, null, 2)}\n`)
console.log(`contenu : ${result.source} (${result.content.version ?? 'seed'})`)
