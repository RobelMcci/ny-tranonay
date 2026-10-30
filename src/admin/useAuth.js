import { useContext } from 'react'
import { AuthContext } from './auth-context.js'

/** @returns {import('./auth-context.js').AuthValue} */
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
  return value
}
