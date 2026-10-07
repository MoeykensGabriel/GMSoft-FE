import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../modules/auth'
import { Button } from '../../modules/core'
import { AdminSidebar } from './AdminSidebar'

/** Estructura compartida por todas las páginas de ADMIN. */
export function AdminLayout() {
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState(false)
  return <div className="admin-shell min-h-screen bg-canvas text-ink md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:grid-rows-[3.5rem_1fr]">
    <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:rounded focus:bg-surface focus:p-3">Ir al contenido</a>
    <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 bg-brand-dark px-4 py-2 text-white md:col-span-2">
      <span className="font-semibold tracking-wide">GMSoft <span className="ml-2 text-xs font-normal">Administración</span></span>
      <span className="hidden text-sm md:block">{user?.fullName || user?.userName}</span>
      <Button variant="secondary" className="md:hidden" aria-controls="admin-navigation" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Cerrar menú' : 'Menú'}
      </Button>
    </header>
    <AdminSidebar userName={user?.fullName || user?.userName || ''} expanded={expanded}
      onNavigate={() => setExpanded(false)} onLogout={logout} />
    <div id="admin-content" tabIndex={-1} className="min-w-0"><Outlet /></div>
  </div>
}
