// Parcours critique de l'administrateur : connexion, modification d'un tarif, liste des changements, publication, site reconstruit.
//
// ATTENTION : ce scénario n'exerce PAS la fonction Netlify `netlify/functions/publish.mjs` (`vite preview` ne sert pas les
// fonctions Netlify). Il publie comme elle le ferait, en appelant la fonction SQL `publish_content` avec la vraie session de
// l'administrateur (connexion par supabase-js dans le test, pas dans le navigateur). La fonction Netlify est couverte par
// `netlify/tests/publish.test.js` et par l'essai manuel en local (voir README).
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { DIST, publicBuildEnv, run, signIn, testAccounts } from './helpers.js'

const normalize = (text) => text.replace(/[\u00A0\u202F]/g, ' ').replace(/\s+/g, ' ').trim()

test('un administrateur modifie un tarif, le publie et le site reconstruit affiche le nouveau prix', async ({ page }) => {
  const { admin, apiUrl, anonKey } = testAccounts()
  const stack = { apiUrl, anonKey }

  // Connexion par le formulaire.
  await page.goto('/admin/connexion')
  await page.getByLabel('Adresse e-mail').fill(admin.email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(admin.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Accueil', level: 1 })).toBeVisible()

  // Juste après l'import initial, le brouillon est identique à ce qui est publié.
  await expect(page.getByText('Aucune modification à publier', { exact: true })).toBeVisible()

  // Tarifs : « Réception événementielle, par jour » passe à 175 000.
  await page.locator('a[href="/admin/tarifs"]:visible').first().click()
  await expect(page).toHaveURL(/\/admin\/tarifs$/)
  const price = page.getByLabel('Réception événementielle, par jour', { exact: true })
  await expect(price).toHaveValue(/150[\s\u00A0\u202F]000/)
  await price.fill('175 000')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText(/^Enregistré à /)).toBeVisible()

  // L'accueil signale la modification non publiée.
  await page.locator('a[href="/admin"]:visible').first().click()
  await expect(page.getByText('1 modification non publiée', { exact: true })).toBeVisible()

  // L'écran Publier détaille le changement : ancien et nouveau montant.
  await page.locator('a[href="/admin/publier"]:visible').first().click()
  const changes = page.getByRole('region', { name: /^Ce qui va changer/ })
  const line = changes.locator('li').filter({ hasText: 'Réception événementielle, par jour' })
  await expect(line).toHaveCount(1)
  const lineText = normalize(await line.innerText())
  expect(lineText).toContain('Tarif — Réception événementielle, par jour')
  expect(lineText).toContain('150 000 Ar')
  expect(lineText).toContain('175 000 Ar')
  expect(lineText.indexOf('150 000 Ar')).toBeLessThan(lineText.indexOf('175 000 Ar'))

  // Publication « comme la fonction » : RPC publish_content avec la session réelle de l'administrateur.
  const { client } = await signIn(stack, admin)
  const { data: snapshotId, error } = await client.rpc('publish_content', { p_label: 'Test de bout en bout' })
  expect(error).toBeNull()
  expect(snapshotId).toMatch(/^[0-9a-f-]{36}$/)

  // Le build lit le nouvel instantané, puis le site est reconstruit.
  const env = publicBuildEnv(stack)
  expect(run('node', ['scripts/fetch-content.mjs'], { env })).toContain(`contenu : supabase (${snapshotId})`)
  run('npm', ['run', 'build'], { env })

  const tarifs = normalize(readFileSync(`${DIST}tarifs-devis.html`, 'utf8').replace(/<[^>]+>/g, ' '))
  expect(tarifs).toMatch(/175[\s\u00A0\u202F]000/)
  const version = JSON.parse(readFileSync(`${DIST}version.json`, 'utf8'))
  expect(version.snapshot).toBe(snapshotId)

  // Après publication, l'accueil ne signale plus rien (le site reconstruit est servi par `vite preview`).
  await page.goto('/admin')
  await expect(page.getByText('Aucune modification à publier', { exact: true })).toBeVisible()
})
