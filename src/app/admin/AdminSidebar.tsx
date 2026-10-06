import { NavLink } from 'react-router-dom'
import { Button } from '../../modules/core'

const sections = [
  { to: '/panel', label: 'Home', end: true },
  { to: '/panel/clientes', label: 'Clientes' },
  { to: '/panel/carga', label: 'Carga inicial' },
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
  return <aside className="border-b border-neutral-300 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-r md:border-b-0">
    <div className="hidden border-b border-neutral-300 p-5 md:block">
      <p className="text-lg font-semibold">GMSoft</p>
      <p className="mt-1 text-sm text-neutral-600">Administración</p>
    </div>
    <div id="admin-navigation" className={`${expanded ? 'flex' : 'hidden'} flex-col md:flex md:min-h-0 md:flex-1 md:overflow-y-auto`}>
      <nav aria-label="Administración" className="flex flex-col gap-1 p-3">
        {sections.map((section) => <NavLink key={section.to} to={section.to} end={section.end} onClick={onNavigate}
          className={({ isActive }) => `flex min-h-11 items-center rounded-md px-3 py-3 text-sm font-medium ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-800 hover:bg-neutral-100'}`}>
          {section.label}
        </NavLink>)}
      </nav>
      <div className="mt-auto flex flex-col gap-3 border-t border-neutral-300 p-4">
        <p className="break-words text-sm text-neutral-600">{userName}</p>
        <Button variant="secondary" onClick={onLogout}>Cerrar sesión</Button>
      </div>
    </div>
  </aside>
}
