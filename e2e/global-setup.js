// Prépare le test de bout en bout : base locale réinitialisée et remplie, deux comptes jetables, site construit
// avec la base locale. Tout se passe sur la pile Supabase locale ; aucune clé n'est affichée ni écrite.
import { randomBytes } from 'node:crypto'
import { adminApi, localStack, publicBuildEnv, run } from './helpers.js'

const suffix = randomBytes(4).toString('hex')
const newPassword = () => randomBytes(24).toString('base64url')

async function createUser(stack, email, password) {
  const user = await adminApi(stack, '/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  return user.id
}

export default async function globalSetup() {
  const stack = localStack()

  run('npm', ['run', 'db:reset'])
  run('npm', ['run', 'seed:db'], { env: { ...process.env, SUPABASE_URL: stack.apiUrl, SUPABASE_SERVICE_ROLE_KEY: stack.serviceKey } })

  const accounts = {
    admin: { email: `e2e-admin-${suffix}@example.test`, password: newPassword() },
    client: { email: `e2e-client-${suffix}@example.test`, password: newPassword() },
  }
  accounts.admin.id = await createUser(stack, accounts.admin.email, accounts.admin.password)
  accounts.client.id = await createUser(stack, accounts.client.email, accounts.client.password)
  await adminApi(stack, '/rest/v1/admins', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: accounts.admin.id }),
  })

  // Transmis aux tests (même arbre de processus) ; la clé service_role n'en fait pas partie.
  Object.assign(process.env, {
    E2E_API_URL: stack.apiUrl,
    E2E_ANON_KEY: stack.anonKey,
    E2E_ADMIN_EMAIL: accounts.admin.email,
    E2E_ADMIN_PASSWORD: accounts.admin.password,
    E2E_ADMIN_ID: accounts.admin.id,
    E2E_CLIENT_EMAIL: accounts.client.email,
    E2E_CLIENT_PASSWORD: accounts.client.password,
    E2E_CLIENT_ID: accounts.client.id,
  })

  // Site construit avec la base locale : /admin parle à la pile locale, les pages publiques viennent de l'instantané « Import initial ».
  run('npm', ['run', 'build'], { env: publicBuildEnv(stack) })
}
