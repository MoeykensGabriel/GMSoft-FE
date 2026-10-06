import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../modules/auth'
import { Button } from '../../modules/core'
import { AdminSidebar } from './AdminSidebar'

/** Estructura compartida por todas las páginas de ADMIN. */
export function AdminLayout() {
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState(false)
  return <div className="min-h-screen bg-white text-neutral-900 md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
    <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:rounded-md focus:bg-white focus:p-3">Ir al contenido</a>
    <header className="flex items-center justify-between gap-3 border-b border-neutral-300 p-3 md:hidden">
      <span className="font-semibold">GMSoft · ADMIN</span>
      <Button variant="secondary" aria-controls="admin-navigation" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Cerrar menú' : 'Menú'}
      </Button>
    </header>
    <AdminSidebar userName={user?.fullName || user?.userName || ''} expanded={expanded}
      onNavigate={() => setExpanded(false)} onLogout={logout} />
    <div id="admin-content" tabIndex={-1} className="min-w-0"><Outlet /></div>
  </div>
}
