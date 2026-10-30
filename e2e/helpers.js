// Aides du test de bout en bout : accès à la pile Supabase LOCALE uniquement, jamais à une base en ligne.
// Les clés sont lues dans `supabase status` à chaque fois et ne sont ni écrites dans un fichier ni affichées.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from '../scripts/lib/env-local.mjs'

export const ROOT = fileURLToPath(new URL('../', import.meta.url))
export const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
export const BASE_URL = 'http://localhost:4173'
/** Nom du conteneur Postgres de la pile locale (`project_id` de supabase/config.toml). */
const DB_CONTAINER = 'supabase_db_ny-tranonay'

const isLocalHost = (value) => {
  try {
    return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(value).hostname)
  } catch {
    return false
  }
}

/**
 * Refuse de continuer si une adresse Supabase de l'environnement, de `.env.local` ou de la pile pointe ailleurs que sur cette machine.
 * @param {string} apiUrl adresse de la pile locale
 */
export function assertLocalOnly(apiUrl) {
  const env = { ...process.env }
  loadEnvLocal(env, `${ROOT}.env.local`)
  const candidates = { 'la pile locale': apiUrl, SUPABASE_URL: env.SUPABASE_URL, VITE_SUPABASE_URL: env.VITE_SUPABASE_URL }
  for (const [name, value] of Object.entries(candidates)) {
    if (value && !isLocalHost(value)) {
      throw new Error(`Test de bout en bout refusé : ${name} ne désigne pas la machine locale. Il efface et réinitialise la base : à ne lancer que sur la pile locale.`)
    }
  }
}

/** @returns {{ apiUrl: string, anonKey: string, serviceKey: string }} lus dans `supabase status` (pile locale démarrée). */
export function localStack() {
  let output
  try {
    output = execFileSync('npx', ['supabase', 'status', '-o', 'env'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    throw new Error('Pile Supabase locale introuvable : lancez `npm run db:start` (Docker requis) puis relancez `npm run e2e`.')
  }
  const values = Object.fromEntries(
    [...output.matchAll(/^([A-Z_]+)="?([^"\n]*)"?$/gm)].map((match) => [match[1], match[2]]),
  )
  const { API_URL: apiUrl, ANON_KEY: anonKey, SERVICE_ROLE_KEY: serviceKey } = values
  if (!apiUrl || !anonKey || !serviceKey) throw new Error('`supabase status` ne renvoie pas API_URL, ANON_KEY et SERVICE_ROLE_KEY : la pile locale est-elle démarrée ?')
  assertLocalOnly(apiUrl)
  return { apiUrl, anonKey, serviceKey }
}

/** Variables publiques seulement : le build ne reçoit jamais la clé service_role. */
export function publicBuildEnv({ apiUrl, anonKey }) {
  const env = { ...process.env, SUPABASE_URL: apiUrl, SUPABASE_ANON_KEY: anonKey, VITE_SUPABASE_URL: apiUrl, VITE_SUPABASE_ANON_KEY: anonKey }
  delete env.SUPABASE_SERVICE_ROLE_KEY
  delete env.BUILD_HOOK_URL
  return env
}

/** Lance une commande (sortie conservée) ; en cas d'échec, l'erreur contient la fin de la sortie, sans l'environnement. */
export function run(command, args, { env = process.env, input } = {}) {
  try {
    return execFileSync(command, args, { cwd: ROOT, env, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 })
  } catch (error) {
    const tail = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(-25).join('\n')
    throw new Error(`Échec de « ${command} ${args.join(' ')} » :\n${tail}`)
  }
}

/** Compte de test créé pour la durée du test (mot de passe aléatoire, transmis aux tests par l'environnement du processus). */
export function testAccounts() {
  const read = (name) => {
    const value = process.env[name]
    if (!value) throw new Error(`${name} absente : le test doit être lancé avec \`npm run e2e\` (globalSetup crée les comptes).`)
    return value
  }
  return {
    admin: { email: read('E2E_ADMIN_EMAIL'), password: read('E2E_ADMIN_PASSWORD'), id: read('E2E_ADMIN_ID') },
    client: { email: read('E2E_CLIENT_EMAIL'), password: read('E2E_CLIENT_PASSWORD'), id: read('E2E_CLIENT_ID') },
    apiUrl: read('E2E_API_URL'),
    anonKey: read('E2E_ANON_KEY'),
  }
}

/** Connexion « comme le navigateur » (clé anonyme + mot de passe) hors du navigateur. @returns {Promise<{ client: object, token: string }>} */
export async function signIn({ apiUrl, anonKey }, { email, password }) {
  assertLocalOnly(apiUrl)
  const client = createClient(apiUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`Connexion de test impossible (${error?.code ?? 'sans session'}).`)
  return { client, token: data.session.access_token }
}

/** Appel à l'API d'administration de GoTrue (clé service_role locale). */
export async function adminApi({ apiUrl, serviceKey }, path, init = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', ...init.headers },
  })
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} : HTTP ${response.status}`)
  return response.status === 204 ? null : response.json().catch(() => null)
}

/** Détache les instantanés d'un utilisateur (table en ajout seul : déclencheurs suspendus le temps de la transaction, base locale jetable). */
export function detachSnapshots(userId) {
  if (!/^[0-9a-f-]{36}$/.test(userId)) throw new Error('Identifiant utilisateur invalide.')
  const sql = [
    'begin;',
    'alter table public.content_snapshots disable trigger user;',
    `update public.content_snapshots set created_by = null where created_by = '${userId}';`,
    'alter table public.content_snapshots enable trigger user;',
    'commit;',
  ].join('\n')
  run('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'], { input: sql })
}
