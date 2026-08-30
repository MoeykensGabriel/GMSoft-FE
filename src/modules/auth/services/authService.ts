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
  /** Con esto entra al sistema. Es la credencial. */
  userName: string
  /** Dato de contacto, no credencial. Puede no tener. */
  email: string | null
  fullName: string
  roles: Role[]
  /** Presente solo si el usuario tiene perfil de chofer. */
  driverId: string | null
}

export type CurrentUser = Omit<AuthResult, 'token'>

export const authService = {
  login: (userName: string, password: string) =>
    api.post<AuthResult>('/api/auth/login', { userName, password }),
}
