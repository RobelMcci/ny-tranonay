// Supprime les deux comptes jetables. La base reste initialisée avec le contenu d'origine (et les instantanés des tests).
// Ne fait jamais échouer la série : en cas de problème, les comptes disparaîtront au prochain `db:reset` (début du prochain run).
import { adminApi, detachSnapshots, localStack } from './helpers.js'

export default async function globalTeardown() {
  const ids = [process.env.E2E_ADMIN_ID, process.env.E2E_CLIENT_ID].filter(Boolean)
  if (ids.length === 0) return
  try {
    const stack = localStack()
    for (const id of ids) {
      // Un administrateur qui a publié est référencé par content_snapshots.created_by : on le détache avant de le supprimer.
      detachSnapshots(id)
      await adminApi(stack, `/auth/v1/admin/users/${id}`, { method: 'DELETE' })
    }
  } catch (error) {
    console.warn(`Nettoyage des comptes de test incomplet (${error.message.split('\n')[0]}) : ils seront supprimés au prochain « npm run db:reset ».`)
  }
}
