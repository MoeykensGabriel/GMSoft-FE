import { Navigate, Outlet } from 'react-router-dom'
import type { ModuleId } from './menu'
import { useModules } from './useModules'

/** Corta la navegación a las pantallas de un módulo apagado. Es solo navegación: los datos los corta el backend. */
export function ModuleRoute({ module }: { module: ModuleId }) {
  const { enabled, isPending } = useModules()
  if (isPending) return <p role="status" className="p-6 text-muted">Cargando…</p>
  return enabled.includes(module) ? <Outlet /> : <Navigate to="/panel" replace />
}
