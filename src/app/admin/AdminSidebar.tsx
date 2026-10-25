import { useEffect, useRef, useState } from 'react'
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
    { to: '/panel/bajas', label: 'Bajas pedidas' },
    { to: '/panel/promociones', label: 'Promociones' },
  ] },
  { id: 'reparto', label: 'Reparto', items: [
    // En el orden del día: de la agenda y la carga de la mañana a la recepción y los números.
    { to: '/panel/agenda', label: 'Agenda' },
    { to: '/panel/carga', label: 'Carga inicial' },
    { to: '/panel/salidas', label: 'Salidas' },
    { to: '/panel/recargas', label: 'Recargas' },
    { to: '/panel/recepcion', label: 'Recepción' },
    { to: '/panel/liquidacion', label: 'Liquidación' },
    { to: '/panel/resumen-diario', label: 'Resumen diario' },
    { to: '/panel/hoja-de-ruta', label: 'Hoja de ruta' },
    { to: '/panel/estadisticas', label: 'Estadísticas' },
  ] },
  { id: 'empresa', label: 'Empresa', items: [
    { to: '/panel/configuracion', label: 'Configuración' },
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

/**
 * El menú de ADMIN. En la computadora queda fijo al costado. En el celular es un panel que
 * entra desde la izquierda sobre la página, que se oscurece detrás; se cierra con la X,
 * tocando afuera, con Escape o al elegir una pantalla.
 */
export function AdminSidebar({ userName, expanded, onClose, onLogout }: {
  userName: string
  expanded: boolean
  onClose: () => void
  onLogout: () => void
}) {
  const closeButton = useRef<HTMLButtonElement>(null)
  // Al abrirse, el foco pasa al menú para que el teclado y el lector de pantalla lo sigan.
  useEffect(() => { if (expanded) closeButton.current?.focus() }, [expanded])
  const onNavigate = onClose
  const { pathname } = useLocation()
  const current = groupOf(pathname)
  // El grupo de la página actual siempre está abierto; los demás los abre y cierra el usuario.
  const [open, setOpen] = useState<string[]>([])
  const isOpen = (id: string) => id === current || open.includes(id)
  const toggle = (id: string) => setOpen((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])

  return <>
    <div aria-hidden="true" onClick={onClose}
      className={`fixed inset-0 z-30 bg-ink/50 transition-opacity duration-200 motion-reduce:transition-none md:hidden ${expanded ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
    <aside id="admin-navigation" aria-label="Menú"
      className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-surface shadow-2xl transition-[translate,visibility] duration-200 motion-reduce:transition-none ${expanded ? 'visible translate-x-0' : 'invisible -translate-x-full'}
        md:visible md:sticky md:top-14 md:bottom-auto md:z-auto md:h-[calc(100dvh-3.5rem)] md:w-auto md:max-w-none md:translate-x-0 md:border-r md:border-line md:shadow-none md:transition-none`}>
    <div className="flex items-start gap-3 bg-brand px-4 py-4 text-white md:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold">GMSoft Administración</p>
        {userName && <p className="mt-0.5 break-words text-sm text-white/80">Usuario: {userName}</p>}
      </div>
      <button ref={closeButton} type="button" aria-label="Cerrar menú" onClick={onClose}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
    <div className="hidden border-b border-line p-5 md:block">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Menú principal</p>
    </div>
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
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
        <p className="hidden break-words text-sm text-muted md:block">{userName}</p>
        <Button variant="secondary" onClick={onLogout}>Cerrar sesión</Button>
      </div>
    </div>
  </aside>
  </>
}
