import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth'
import { Button, ScreenErrorBoundary } from '../../core'

/** Marco del controlador: quién es y cómo salir. Celular primero. */
export function InspectionLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  return <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-3">
    <header className="flex items-center justify-between gap-3">
      <p className="text-sm">Controlador: <strong>{user?.fullName || user?.userName}</strong></p>
      <Button variant="danger" onClick={() => logout('Manual')}>Salir</Button>
    </header>
    <ScreenErrorBoundary resetKey={pathname}><Outlet /></ScreenErrorBoundary>
  </div>
}
