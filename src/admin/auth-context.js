import { createContext } from 'react'

/**
 * @typedef {object} AuthValue
 * @property {import('@supabase/supabase-js').Session | null} session
 * @property {boolean} isAdmin
 * @property {boolean} loading
 * @property {boolean} recovery         vrai pendant une session ouverte par un lien « mot de passe oublié »
 * @property {string | null} flash       message de succès à afficher une fois (ex. mot de passe mis à jour)
 * @property {string | null} notice      message à afficher sur la page de connexion (compte refusé…)
 * @property {string | null} configError message si la configuration Supabase est absente
 * @property {(email: string, password: string) => Promise<void>} signIn
 * @property {() => Promise<void>} signOut
 * @property {(email: string) => Promise<void>} resetPassword
 * @property {(password: string) => Promise<void>} updatePassword  fixe le nouveau mot de passe et termine la récupération
 * @property {() => void} clearNotice
 * @property {() => void} clearFlash
 */

/** @type {import('react').Context<AuthValue | null>} */
export const AuthContext = createContext(null)
