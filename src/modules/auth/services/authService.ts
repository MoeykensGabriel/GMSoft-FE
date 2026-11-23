import { api } from '../../core'
import { deviceId, isInstalledApp } from './deviceIdentity'

/** Los roles del backend, tal cual los emite en el token. */
export const ROLES = {
  admin: 'Admin',
  driver: 'Driver',
  /** Controlador en ruta: se sube a un camión a contar envases y confirmar clientes. */
  inspector: 'Inspector',
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

/** Por qué la app cierra la sesión. Los vencimientos y cambios de cuenta los anota el servidor. */
export type LogoutReason = 'Manual' | 'ReceptionCompleted' | 'DepartureCancelled'
export const LOGOUT_REASONS: readonly string[] = ['Manual', 'ReceptionCompleted', 'DepartureCancelled']

export const authService = {
  login: (userName: string, password: string) =>
    api.post<AuthResult>('/api/auth/login', { userName, password, installed: isInstalledApp(), deviceId: deviceId() }),
  /** Avisa la salida al control de sesiones. Va antes de borrar el token. */
  logout: (reason: LogoutReason) => api.notify('/api/auth/logout', { reason }),
}
