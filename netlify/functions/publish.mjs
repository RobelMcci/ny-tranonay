// Publication du contenu (Netlify Function v2, même origine que le tableau de bord).
//
// L'appelant doit être administrateur : la fonction transmet SON jeton à Supabase, c'est `is_admin()` (dans les
// fonctions SQL) qui décide. Le build hook (`BUILD_HOOK_URL`) n'est appelé qu'après un succès et n'est jamais
// divulgué : ni dans une réponse, ni dans un journal. Rien n'est journalisé ici (ni jeton, ni clé, ni corps).
//
// Variables d'environnement requises : SUPABASE_URL, SUPABASE_ANON_KEY, BUILD_HOOK_URL.

const TIMEOUT_MS = 10_000
const MAX_LABEL = 60
const MAX_BODY = 4096
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BEARER = /^Bearer ([A-Za-z0-9._~+/=-]{1,4096})$/
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g

const REJECTED = {
  settings: 'Les informations générales du site ne sont pas encore enregistrées : renseignez-les avant de publier.',
  notFound: 'Cette version est introuvable : rechargez la page.',
  other: 'La demande a été refusée : vérifiez le contenu puis réessayez.',
}

function reply(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  })
}

/** Date en français, heure de Madagascar : « 29 octobre 2026 à 14:05 ». */
function defaultLabel(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Indian/Antananarivo',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  )
  return `Publication du ${parts.day} ${parts.month} ${parts.year} à ${parts.hour}:${parts.minute}`
}

/** Étiquette fournie si c'est un texte de 1 à 60 caractères (hors caractères de contrôle), sinon étiquette par défaut. */
function chooseLabel(value) {
  if (typeof value === 'string') {
    const clean = value.replace(CONTROL_CHARS, '').trim()
    if (clean.length > 0 && clean.length <= MAX_LABEL) return clean
  }
  return defaultLabel()
}

function validUrl(value) {
  if (typeof value !== 'string' || value === '') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

async function readAction(request) {
  let text
  try {
    text = await request.text()
  } catch {
    return null
  }
  if (text.length > MAX_BODY) return null
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  if (body.action === 'publish') return { action: 'publish', label: chooseLabel(body.label) }
  if (body.action === 'restore') {
    return typeof body.snapshotId === 'string' && UUID.test(body.snapshotId) ? { action: 'restore', snapshotId: body.snapshotId } : null
  }
  if (body.action === 'rebuild') return { action: 'rebuild' }
  return null
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Appelle une fonction SQL avec le jeton de l'utilisateur.
 * @returns {Promise<{ kind: 'ok', data: unknown } | { kind: 'forbidden' } | { kind: 'rejected', message: string } | { kind: 'upstream' }>}
 */
async function callRpc({ fetchImpl, baseUrl, anonKey, jwt }, name, args) {
  let response
  try {
    response = await fetchImpl(`${baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return { kind: 'upstream' }
  }
  if (response.ok) return { kind: 'ok', data: await readJson(response) }
  // PostgREST répond parfois 500 pour une erreur SQL métier (P0002 : instantané introuvable) : on lit donc le code d'abord.
  const error = await readJson(response)
  const code = error && typeof error.code === 'string' ? error.code : ''
  const message = error && typeof error.message === 'string' ? error.message : ''
  if (response.status === 401 || response.status === 403 || code === '42501' || /forbidden/i.test(message)) return { kind: 'forbidden' }
  if (code === 'P0002') return { kind: 'rejected', message: REJECTED.notFound }
  if (response.status >= 500 || response.status === 408 || response.status === 429) return { kind: 'upstream' }
  if (/settings missing/i.test(message)) return { kind: 'rejected', message: REJECTED.settings }
  if (code === '22P02' || response.status === 404) return { kind: 'rejected', message: REJECTED.notFound }
  return { kind: 'rejected', message: REJECTED.other }
}

/** Lance la construction du site. @returns {Promise<boolean>} vrai si Netlify a accepté la demande. */
async function triggerBuild(fetchImpl, hookUrl) {
  try {
    const response = await fetchImpl(hookUrl, { method: 'POST', signal: AbortSignal.timeout(TIMEOUT_MS) })
    return response.ok
  } catch {
    return false
  }
}

function failureResponse(result) {
  if (result.kind === 'forbidden') return reply(403, { error: 'forbidden' })
  if (result.kind === 'rejected') return reply(422, { error: 'rejected', message: result.message })
  return reply(502, { error: 'upstream' })
}

/**
 * @param {Request} request
 * @param {{ env: Record<string, string | undefined>, fetchImpl: typeof fetch }} deps
 * @returns {Promise<Response>}
 */
export async function handle(request, { env, fetchImpl }) {
  try {
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' }, { Allow: 'POST' })

    const match = BEARER.exec(request.headers.get('Authorization') ?? '')
    if (!match) return reply(401, { error: 'unauthorized' })

    const supabaseUrl = validUrl(env.SUPABASE_URL)
    const hook = validUrl(env.BUILD_HOOK_URL)
    const anonKey = env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !hook || typeof anonKey !== 'string' || anonKey === '') return reply(500, { error: 'configuration' })

    const input = await readAction(request)
    if (!input) return reply(400, { error: 'bad_request' })

    const rpc = { fetchImpl, baseUrl: supabaseUrl.href.replace(/\/+$/, ''), anonKey, jwt: match[1] }

    if (input.action === 'rebuild') {
      const check = await callRpc(rpc, 'is_admin', {})
      if (check.kind !== 'ok') return check.kind === 'forbidden' ? reply(403, { error: 'forbidden' }) : reply(502, { error: 'upstream' })
      if (check.data !== true) return reply(403, { error: 'forbidden' })
      return (await triggerBuild(fetchImpl, hook.href)) ? reply(200, { ok: true }) : reply(502, { error: 'build_hook_failed' })
    }

    const result =
      input.action === 'publish'
        ? await callRpc(rpc, 'publish_content', { p_label: input.label })
        : await callRpc(rpc, 'restore_snapshot', { p_id: input.snapshotId })
    if (result.kind !== 'ok') return failureResponse(result)
    if (typeof result.data !== 'string' || !UUID.test(result.data)) return reply(502, { error: 'upstream' })

    const snapshotId = result.data
    return (await triggerBuild(fetchImpl, hook.href)) ? reply(200, { snapshotId }) : reply(502, { error: 'build_hook_failed', snapshotId })
  } catch {
    return reply(500, { error: 'internal' })
  }
}

export default (request) => handle(request, { env: process.env, fetchImpl: fetch })
