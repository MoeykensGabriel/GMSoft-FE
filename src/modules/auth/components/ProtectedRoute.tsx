import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../services/authService'

/**
 * Corta el paso segun el rol. Es solo para la navegacion: el permiso de verdad lo
 * aplica el backend en cada endpoint. Esto evita que alguien caiga en una pantalla
 * que no le sirve, no protege datos.
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // Se recuerda a donde queria ir, para volver ahi despues de entrar.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.some((r) => user.roles.includes(r))) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
