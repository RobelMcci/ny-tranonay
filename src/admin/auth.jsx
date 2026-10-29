import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context.js'
import { authErrorMessage } from './auth-errors.js'
import { getSupabase } from './supabase.js'

const NOT_AUTHORIZED = "Ce compte n'est pas autorisé."
const CHECK_FAILED = 'Impossible de vérifier votre compte. Réessayez dans un instant.'
const PASSWORD_UPDATED = 'Votre mot de passe a été mis à jour.'

/** Déconnexion qui n'échoue jamais en silence : repli sur une déconnexion locale si le serveur est injoignable. */
async function forceSignOut(supabase) {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // Rien de plus à faire : la session sera ignorée à la prochaine vérification.
    }
  }
}

// Le hook `useAuth` vit dans `useAuth.js` (règle react-refresh : un fichier de composant n'exporte que des composants).
export function AuthProvider({ children }) {
  const [configError, setConfigError] = useState(null)
  // `recovery` : session issue d'un lien « mot de passe oublié » (événement PASSWORD_RECOVERY).
  const [state, setState] = useState({ ready: false, session: null, recovery: false })
  // Résultat de is_admin() pour un utilisateur donné.
  const [adminCheck, setAdminCheck] = useState({ userId: null, value: false })
  const [notice, setNotice] = useState(null)
  const [flash, setFlash] = useState(null)

  // 1. Session : abonnement aux changements (INITIAL_SESSION donne l'état initial) + lecture de repli.
  useEffect(() => {
    let supabase
    try {
      supabase = getSupabase()
    } catch (error) {
      queueMicrotask(() => {
        setConfigError(error.message)
        setState({ ready: true, session: null, recovery: false })
      })
      return undefined
    }
    let active = true
    // Le callback reste synchrone : aucun appel Supabase à l'intérieur (risque de blocage de la bibliothèque).
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState((prev) => ({
        ready: true,
        session,
        recovery: event === 'PASSWORD_RECOVERY' ? true : event === 'SIGNED_OUT' || !session ? false : prev.recovery,
      }))
      if (!session) setAdminCheck({ userId: null, value: false })
    })
    // Repli : un résultat tardif ne remplace jamais un état déjà fourni par un événement.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (active) setState((prev) => (prev.ready ? prev : { ready: true, session, recovery: false }))
      })
      .catch(() => {
        if (active) setState((prev) => (prev.ready ? prev : { ready: true, session: null, recovery: false }))
      })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  // 2. Vérification administrateur à chaque nouvel utilisateur connecté (aussi pour une session de récupération).
  const userId = state.session?.user?.id ?? null
  useEffect(() => {
    if (!userId) return undefined
    let active = true
    const supabase = getSupabase()
    supabase
      .rpc('is_admin')
      .then(({ data, error }) => {
        if (!active) return
        if (error || data !== true) {
          setNotice(error ? CHECK_FAILED : NOT_AUTHORIZED)
          // Mémo « non admin » le temps de terminer le chargement ; effacé à la déconnexion (SIGNED_OUT).
          setAdminCheck({ userId, value: false })
          forceSignOut(supabase).then(() => {
            if (active) setAdminCheck({ userId: null, value: false })
          })
          return
        }
        setAdminCheck({ userId, value: true })
      })
      .catch(() => {
        if (!active) return
        setNotice(CHECK_FAILED)
        setAdminCheck({ userId, value: false })
        forceSignOut(supabase)
      })
    return () => {
      active = false
    }
  }, [userId])

  const checking = userId !== null && adminCheck.userId !== userId
  const isAdmin = userId !== null && adminCheck.userId === userId && adminCheck.value
  const loading = !state.ready || checking

  const signIn = useCallback(async (email, password) => {
    const supabase = getSupabase() // lève un message français si la configuration manque
    setNotice(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(authErrorMessage(error))
  }, [])

  const signOut = useCallback(async () => {
    await forceSignOut(getSupabase())
    setAdminCheck({ userId: null, value: false })
  }, [])

  const resetPassword = useCallback(async (email) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/connexion`,
    })
    if (error) throw new Error(authErrorMessage(error))
  }, [])

  const updatePassword = useCallback(async (password) => {
    const { error } = await getSupabase().auth.updateUser({ password })
    if (error) throw new Error(authErrorMessage(error))
    setState((prev) => ({ ...prev, recovery: false }))
    setFlash(PASSWORD_UPDATED)
  }, [])

  const clearNotice = useCallback(() => setNotice(null), [])
  const clearFlash = useCallback(() => setFlash(null), [])

  const value = useMemo(
    () => ({
      session: state.session,
      isAdmin,
      loading,
      recovery: state.recovery,
      notice,
      flash,
      configError,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      clearNotice,
      clearFlash,
    }),
    [state.session, state.recovery, isAdmin, loading, notice, flash, configError, signIn, signOut, resetPassword, updatePassword, clearNotice, clearFlash],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
