// Mini-parseur de .env.local (KEY=VALUE, commentaires #, guillemets optionnels) ; n'écrase pas l'environnement.
import { existsSync, readFileSync } from 'node:fs'

/**
 * @param {Record<string, string | undefined>} env  objet complété en place (les clés déjà définies sont conservées)
 * @param {string} path                             chemin du fichier .env.local (absent : rien ne se passe)
 */
export function loadEnvLocal(env, path) {
  if (!existsSync(path)) return
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
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
