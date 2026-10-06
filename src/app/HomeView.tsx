import { Navigate } from 'react-router-dom'
import { ROLES, useAuth } from '../modules/auth'
import { Button } from '../modules/core'

/** Entrada según el rol; la Home de administración vive en el panel. */
export function HomeView() {
  const { user, logout } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.roles.includes(ROLES.admin)) return <Navigate to="/panel" replace />
  if (user.roles.includes(ROLES.driver)) return <Navigate to="/reparto" replace />
  return <main className="p-6"><p>Tu usuario no tiene un perfil asignado.</p><Button variant="secondary" onClick={logout}>Cerrar sesión</Button></main>
}
