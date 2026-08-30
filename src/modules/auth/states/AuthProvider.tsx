import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { setOnUnauthorized, tokenStorage } from '../../core'
import { authService } from '../services/authService'
import type { CurrentUser, Role } from '../services/authService'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

const USER_KEY = 'gmsoft.user'

/**
 * El usuario se guarda junto al token para no pedirlo de nuevo al recargar. Es solo
 * para pintar la pantalla: quien puede hacer que lo decide el backend en cada
 * request, nunca este objeto.
 */
function leerUsuarioGuardado(): CurrentUser | null {
  if (!tokenStorage.get()) return null
  try {
    const crudo = localStorage.getItem(USER_KEY)
    return crudo ? (JSON.parse(crudo) as CurrentUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(leerUsuarioGuardado)

  const logout = useCallback(() => {
    tokenStorage.clear()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // Si el token vence en medio de una consulta, la sesion se cierra sola en vez de
  // dejar al usuario en una pantalla que falla en cada click.
  useEffect(() => {
    setOnUnauthorized(logout)
  }, [logout])

  const login = useCallback(async (userName: string, password: string) => {
    const { token, ...datos } = await authService.login(userName, password)

    tokenStorage.set(token)
    localStorage.setItem(USER_KEY, JSON.stringify(datos))
    setUser(datos)

    return datos
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      logout,
      hasRole: (role: Role) => user?.roles.includes(role) ?? false,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
