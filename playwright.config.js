// Test de bout en bout (npm run e2e). Distinct de `npm test` : il exige la pile Supabase locale (Docker) et réinitialise sa base.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.spec.js',
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Sert dist/ (construit par globalSetup, reconstruit par le test). `vite preview` exige que dist/ existe au démarrage,
  // qui précède globalSetup : on le crée vide au besoin. Prêt dès que le port répond (dist/ peut encore être vide).
  webServer: {
    command: 'mkdir -p dist && npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
