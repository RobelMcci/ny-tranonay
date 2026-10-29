// Un compte authentifié qui n'est pas administrateur (futur compte client) est refusé et ne peut rien écrire.
import { expect, test } from '@playwright/test'
import { signIn, testAccounts } from './helpers.js'

test('un compte non administrateur est refusé et ne peut ni écrire ni publier', async ({ page }) => {
  const { client, apiUrl, anonKey } = testAccounts()

  await page.goto('/admin/connexion')
  await page.getByLabel('Adresse e-mail').fill(client.email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(client.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page.getByText("Ce compte n'est pas autorisé.")).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/connexion$/)
  await expect(page.getByRole('button', { name: 'Se déconnecter' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCount(0)

  // Directement sur l'API avec le jeton du compte : la base refuse (ou ne montre rien).
  const { token } = await signIn({ apiUrl, anonKey }, client)
  const headers = { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const insert = await fetch(`${apiUrl}/rest/v1/prices`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ key: 'e2e_intrus', label: 'Intrus', amount: 1, unit: 'ar' }),
  })
  expect([401, 403]).toContain(insert.status)

  const update = await fetch(`${apiUrl}/rest/v1/prices?key=eq.reception_jour`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ amount: 1 }),
  })
  // Sans ligne visible, PostgREST répond 200 avec zéro ligne modifiée (ou refuse).
  expect([200, 401, 403]).toContain(update.status)
  if (update.status === 200) expect(await update.json()).toEqual([])

  const read = await fetch(`${apiUrl}/rest/v1/prices?select=key`, { headers })
  expect(read.status).toBe(200)
  expect(await read.json()).toEqual([])

  const publish = await fetch(`${apiUrl}/rest/v1/rpc/publish_content`, { method: 'POST', headers, body: JSON.stringify({ p_label: 'intrus' }) })
  expect(publish.ok).toBe(false)
  const history = await fetch(`${apiUrl}/rest/v1/content_snapshots?select=id`, { headers })
  expect(await history.json()).toEqual([])
})
