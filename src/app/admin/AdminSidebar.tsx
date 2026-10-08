import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '../../modules/core'

interface Item { to: string; label: string; end?: boolean }
interface Group { id: string; label: string; items: Item[] }

const home: Item = { to: '/panel', label: 'Home', end: true }

// El menú se agrupa por tarea para no crecer hacia abajo con cada pantalla nueva.
const groups: Group[] = [
  { id: 'clientes', label: 'Clientes', items: [
    { to: '/panel/clientes', label: 'Clientes' },
    { to: '/panel/recorridos', label: 'Recorridos' },
    { to: '/panel/promociones', label: 'Promociones' },
  ] },
  { id: 'reparto', label: 'Reparto', items: [
    { to: '/panel/carga', label: 'Carga inicial' },
    { to: '/panel/recargas', label: 'Recargas' },
    { to: '/panel/salidas', label: 'Salidas y recepción' },
    { to: '/panel/liquidacion', label: 'Liquidación' },
    { to: '/panel/resumen-diario', label: 'Resumen diario' },
  ] },
  { id: 'empresa', label: 'Empresa', items: [
    { to: '/panel/vehiculos', label: 'Vehículos' },
    { to: '/panel/choferes', label: 'Choferes' },
    { to: '/panel/catalogo', label: 'Productos' },
    { to: '/panel/zonas', label: 'Zonas de reparto' },
  ] },
]

const groupOf = (pathname: string) =>
  groups.find((group) => group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)))?.id

const linkClass = (isActive: boolean, nested = false) =>
  `flex min-h-11 items-center rounded border-l-3 py-2 text-sm font-medium ${nested ? 'pl-7 pr-3' : 'px-3'} ${isActive ? 'border-accent bg-accent-soft text-brand-dark' : 'border-transparent text-muted hover:bg-canvas hover:text-brand'}`

export function AdminSidebar({ userName, expanded, onNavigate, onLogout }: {
  userName: string
  expanded: boolean
  onNavigate: () => void
  onLogout: () => void
}) {
  const { pathname } = useLocation()
  const current = groupOf(pathname)
  // El grupo de la página actual siempre está abierto; los demás los abre y cierra el usuario.
  const [open, setOpen] = useState<string[]>([])
  const isOpen = (id: string) => id === current || open.includes(id)
  const toggle = (id: string) => setOpen((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])

  return <aside className="border-b border-line bg-surface md:sticky md:top-14 md:flex md:h-[calc(100dvh-3.5rem)] md:flex-col md:border-r md:border-b-0">
    <div className="hidden border-b border-line p-5 md:block">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Menú principal</p>
    </div>
    <div id="admin-navigation" className={`${expanded ? 'flex' : 'hidden'} flex-col md:flex md:min-h-0 md:flex-1 md:overflow-y-auto`}>
      <nav aria-label="Administración" className="flex flex-col gap-1 p-3">
        <NavLink to={home.to} end={home.end} onClick={onNavigate} className={({ isActive }) => linkClass(isActive)}>{home.label}</NavLink>
        {groups.map((group) => {
          const shown = isOpen(group.id)
          return <div key={group.id} className="flex flex-col gap-1">
            <button type="button" aria-expanded={shown} aria-controls={`admin-menu-${group.id}`}
              // El grupo de la página actual no se puede cerrar: se vería sin selección.
              onClick={() => { if (group.id !== current) toggle(group.id) }}
              className={`flex min-h-11 w-full items-center justify-between rounded border-l-3 border-transparent px-3 py-2 text-left text-sm font-semibold hover:bg-canvas ${group.id === current ? 'text-brand-dark' : 'text-ink'}`}>
              {group.label}
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75"
                strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform ${shown ? 'rotate-90' : ''}`}>
                <path d="M8 5l5 5-5 5" />
              </svg>
            </button>
            <div id={`admin-menu-${group.id}`} hidden={!shown} className="flex flex-col gap-1">
              {group.items.map((item) => <NavLink key={item.to} to={item.to} onClick={onNavigate}
                className={({ isActive }) => linkClass(isActive, true)}>{item.label}</NavLink>)}
            </div>
          </div>
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3 border-t border-line p-4">
        <p className="break-words text-sm text-muted">{userName}</p>
        <Button variant="secondary" onClick={onLogout}>Cerrar sesión</Button>
      </div>
    </div>
  </aside>
}
