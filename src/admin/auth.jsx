import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context.js'
import { authErrorMessage } from './auth-errors.js'
import { getSupabase } from './supabase.js'

const NOT_AUTHORIZED = "Ce compte n'est pas autorisé."
const CHECK_FAILED = 'Impossible de vérifier votre compte. Réessayez dans un instant.'

// Le hook `useAuth` vit dans `useAuth.js` (règle react-refresh : un fichier de composant n'exporte que des composants).
export function AuthProvider({ children }) {
  const [configError, setConfigError] = useState(null)
  const [state, setState] = useState({ ready: false, session: null })
  // Résultat de is_admin() pour un utilisateur donné.
  const [adminCheck, setAdminCheck] = useState({ userId: null, value: false })
  const [notice, setNotice] = useState(null)

  // 1. Session : lecture initiale + abonnement aux changements.
  useEffect(() => {
    let supabase
    try {
      supabase = getSupabase()
    } catch (error) {
      queueMicrotask(() => {
        setConfigError(error.message)
        setState({ ready: true, session: null })
      })
      return undefined
    }
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ ready: true, session: data.session })
    })
    // Le callback reste synchrone : aucun appel Supabase à l'intérieur (risque de blocage de la bibliothèque).
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ ready: true, session })
      if (!session) setAdminCheck({ userId: null, value: false })
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  // 2. Vérification administrateur à chaque nouvel utilisateur connecté.
  const userId = state.session?.user?.id ?? null
  useEffect(() => {
    if (!userId) return undefined
    let active = true
    const supabase = getSupabase()
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!active) return
      if (error || data !== true) {
        setNotice(error ? CHECK_FAILED : NOT_AUTHORIZED)
        setAdminCheck({ userId, value: false })
        supabase.auth.signOut()
        return
      }
      setAdminCheck({ userId, value: true })
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
    await getSupabase().auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/connexion`,
    })
    if (error) throw new Error(authErrorMessage(error))
  }, [])

  const value = useMemo(
    () => ({ session: state.session, isAdmin, loading, notice, configError, signIn, signOut, resetPassword }),
    [state.session, isAdmin, loading, notice, configError, signIn, signOut, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
