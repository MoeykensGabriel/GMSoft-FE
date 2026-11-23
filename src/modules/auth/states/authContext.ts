import { createContext } from 'react'
import type { CurrentUser, LogoutReason, Role } from '../services/authService'

export interface AuthContextValue {
  user: CurrentUser | null
  login: (userName: string, password: string) => Promise<CurrentUser>
  logout: (reason?: LogoutReason) => void
  hasRole: (role: Role) => boolean
}

/**
 * Va en su propio archivo y no junto al provider: un archivo que exporta un
 * componente y ademas otra cosa rompe el Fast Refresh en desarrollo.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
