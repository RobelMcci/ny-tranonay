import { useState } from 'react'
import { useAuth } from './useAuth.js'
import { validateNewPassword } from './password.js'

/** Affichée après un lien « mot de passe oublié » : l'administrateur choisit son nouveau mot de passe. */
export default function NewPassword({ onDone }) {
  const { updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(event) {
    event.preventDefault()
    const invalid = validateNewPassword(password, confirm)
    if (invalid) {
      setError(invalid)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await updatePassword(password)
      onDone()
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FDF6EC] px-4 py-10">
      <div className="card-surface w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl">Nouveau mot de passe</h1>
        <p className="mt-2 text-slate-700">Choisissez un nouveau mot de passe d’au moins 10 caractères.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="new-password" className="field-label">Nouveau mot de passe</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="field-label">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              className="input-field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <div role="alert" aria-live="assertive">
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 ring-1 ring-red-200">{error}</p>}
          </div>

          <button type="submit" className="btn-primary touch-target w-full" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => signOut()}
          disabled={submitting}
          className="touch-target mt-4 text-sm font-semibold text-slate-700 underline underline-offset-2 disabled:opacity-50"
        >
          Annuler et se déconnecter
        </button>
      </div>
    </main>
  )
}
