import { Navigate } from 'react-router-dom'
import { ROLES, useAuth } from '../modules/auth'
import { Button } from '../modules/core'

/** Manda a cada rol a lo suyo. El chofer va derecho a su salida del dia. */
export function HomeView() {
  const { user, logout } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.roles.includes(ROLES.driver)) return <Navigate to="/reparto" replace />

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
      <p className="text-slate-600">{user.fullName || user.userName}</p>
      <Button variant="secondary" onClick={logout}>
        Salir
      </Button>
    </main>
  )
}
