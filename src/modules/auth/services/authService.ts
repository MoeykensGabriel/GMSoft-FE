import { api } from '../../core'

/** Los roles del backend, tal cual los emite en el token. */
export const ROLES = {
  admin: 'Admin',
  driver: 'Driver',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** Lo que devuelve POST /api/auth/login. */
export interface AuthResult {
  token: string
  userId: string
  email: string
  fullName: string
  roles: Role[]
  /** Presente solo si el usuario tiene perfil de chofer. */
  driverId: string | null
}

export type CurrentUser = Omit<AuthResult, 'token'>

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResult>('/api/auth/login', { email, password }),
}
