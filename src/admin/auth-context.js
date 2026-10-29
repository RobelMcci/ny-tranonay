import { createContext } from 'react'

/**
 * @typedef {object} AuthValue
 * @property {import('@supabase/supabase-js').Session | null} session
 * @property {boolean} isAdmin
 * @property {boolean} loading
 * @property {string | null} notice      message à afficher sur la page de connexion (compte refusé…)
 * @property {string | null} configError message si la configuration Supabase est absente
 * @property {(email: string, password: string) => Promise<void>} signIn
 * @property {() => Promise<void>} signOut
 * @property {(email: string) => Promise<void>} resetPassword
 */

/** @type {import('react').Context<AuthValue | null>} */
export const AuthContext = createContext(null)
