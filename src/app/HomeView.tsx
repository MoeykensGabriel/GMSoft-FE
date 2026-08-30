import { Navigate } from 'react-router-dom'
import { ROLES, useAuth } from '../modules/auth'
import { Button } from '../modules/core'

/**
 * Pantalla de entrada. Manda a cada rol a lo suyo; por ahora los destinos todavia no
 * existen, asi que muestra un placeholder con la sesion activa.
 */
export function HomeView() {
  const { user, logout } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  const esChofer = user.roles.includes(ROLES.driver)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        {esChofer ? 'Reparto' : 'Panel'}
      </h1>
      <p className="text-slate-600">{user.fullName || user.userName}</p>
      <p className="text-sm text-slate-500">{user.roles.join(', ')}</p>
      <Button variant="secondary" onClick={logout}>
        Salir
      </Button>
    </main>
  )
}
