import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './useAuth.js'

export function Component() {
  const { signIn, resetPassword, notice, configError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const message = error ?? configError ?? notice

  async function onSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setInfo(null)
    try {
      await signIn(email.trim(), password)
      // Succès : AdminLayout redirige vers /admin (ou affiche le refus d'un compte non administrateur).
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function onForgot() {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError('Saisissez votre adresse e-mail pour recevoir le lien de réinitialisation.')
      return
    }
    setSubmitting(true)
    try {
      await resetPassword(email.trim())
      setInfo('Si un compte correspond à cette adresse, un e-mail de réinitialisation vient d’être envoyé.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FDF6EC] px-4 py-10">
      <div className="card-surface w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl">Administration</h1>
        <p className="mt-2 text-slate-700">Connectez-vous pour modifier le contenu de Tranonay.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="field-label">Adresse e-mail</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="field-label">Mot de passe</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div role="alert" aria-live="assertive">
            {message && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 ring-1 ring-red-200">{message}</p>}
          </div>
          <div role="status">
            {info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200">{info}</p>}
          </div>

          <button type="submit" className="btn-primary touch-target w-full" disabled={submitting || !email || !password}>
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={onForgot}
            disabled={submitting}
            className="touch-target font-semibold text-[#9A3412] underline underline-offset-2 disabled:opacity-50"
          >
            Mot de passe oublié ?
          </button>
          <Link to="/" className="touch-target flex items-center font-semibold text-slate-700 underline underline-offset-2">
            Retour au site
          </Link>
        </div>
      </div>
    </main>
  )
}
