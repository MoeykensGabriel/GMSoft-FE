import { NavLink } from 'react-router-dom'
import { Button } from '../../modules/core'

const sections = [
  { to: '/panel', label: 'Home', end: true },
  { to: '/panel/vehiculos', label: 'Vehículos' },
  { to: '/panel/choferes', label: 'Choferes' },
  { to: '/panel/clientes', label: 'Clientes' },
  { to: '/panel/promociones', label: 'Promociones' },
  { to: '/panel/carga', label: 'Carga inicial' },
  { to: '/panel/recargas', label: 'Recargas' },
  { to: '/panel/salidas', label: 'Salidas y recepción' },
  { to: '/panel/liquidacion', label: 'Liquidación' },
  { to: '/panel/catalogo', label: 'Productos' },
  { to: '/panel/zonas', label: 'Zonas de reparto' },
]

export function AdminSidebar({ userName, expanded, onNavigate, onLogout }: {
  userName: string
  expanded: boolean
  onNavigate: () => void
  onLogout: () => void
}) {
  return <aside className="border-b border-line bg-surface md:sticky md:top-14 md:flex md:h-[calc(100dvh-3.5rem)] md:flex-col md:border-r md:border-b-0">
    <div className="hidden border-b border-line p-5 md:block">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Menú principal</p>
    </div>
    <div id="admin-navigation" className={`${expanded ? 'flex' : 'hidden'} flex-col md:flex md:min-h-0 md:flex-1 md:overflow-y-auto`}>
      <nav aria-label="Administración" className="flex flex-col gap-1 p-3">
        {sections.map((section) => <NavLink key={section.to} to={section.to} end={section.end} onClick={onNavigate}
          className={({ isActive }) => `flex min-h-11 items-center rounded border-l-3 px-3 py-2 text-sm font-medium ${isActive ? 'border-accent bg-accent-soft text-brand-dark' : 'border-transparent text-muted hover:bg-canvas hover:text-brand'}`}>
          {section.label}
        </NavLink>)}
      </nav>
      <div className="mt-auto flex flex-col gap-3 border-t border-line p-4">
        <p className="break-words text-sm text-muted">{userName}</p>
        <Button variant="secondary" onClick={onLogout}>Cerrar sesión</Button>
      </div>
    </div>
  </aside>
}
