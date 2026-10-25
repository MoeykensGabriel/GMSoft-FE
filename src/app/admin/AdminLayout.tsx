import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../modules/auth'
import { Button, ScreenErrorBoundary } from '../../modules/core'
import { AdminSidebar } from './AdminSidebar'

/** El ancho desde el que el menú queda fijo al costado, como en la computadora. */
const DESKTOP = '(min-width: 768px)'

/**
 * Estructura compartida por todas las páginas de ADMIN.
 *
 * En el celular el menú se abre desde el botón de arriba a la izquierda, como un panel
 * que entra desde el costado y oscurece la página. Mientras está abierto, la página de
 * atrás no responde ni se desplaza: el foco y el scroll quedan en el menú.
 */
export function AdminLayout() {
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const { pathname } = useLocation()
  const menuButton = useRef<HTMLButtonElement>(null)
  const wasExpanded = useRef(false)

  useEffect(() => {
    if (!expanded) {
      // Al cerrar, el foco vuelve al botón que lo abrió.
      if (wasExpanded.current) menuButton.current?.focus()
      wasExpanded.current = false
      return
    }
    wasExpanded.current = true
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false) }
    // Si se agranda la ventana, el menú pasa a estar fijo al costado y el panel se cierra.
    const desktop = window.matchMedia(DESKTOP)
    const onResize = () => { if (desktop.matches) setExpanded(false) }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onResize)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onResize)
    }
  }, [expanded])

  const userName = user?.userName || user?.fullName || ''

  return <div className="admin-shell min-h-dvh bg-canvas text-ink md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:grid-rows-[3.5rem_1fr]">
    <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:rounded focus:bg-surface focus:p-3">Ir al contenido</a>
    <header inert={expanded} className="sticky top-0 z-20 grid h-14 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 bg-brand-dark px-2 text-white md:col-span-2 md:px-4">
      <button ref={menuButton} type="button" aria-label="Abrir menú" aria-controls="admin-navigation" aria-expanded={expanded}
        onClick={() => setExpanded(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <span className="col-start-2 text-center text-lg font-semibold tracking-wide">Administración</span>
    </header>
    <AdminSidebar expanded={expanded} onClose={() => setExpanded(false)} />
    <div id="admin-content" tabIndex={-1} inert={expanded} className="flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col print:min-h-0">
      <div className="min-w-0 flex-1"><ScreenErrorBoundary resetKey={pathname}><Outlet /></ScreenErrorBoundary></div>
      <footer aria-label="Cuenta" className="flex flex-col items-end gap-2 border-t border-line bg-surface p-4 text-right md:px-6 print:hidden">
        {userName && <p className="max-w-full text-sm text-muted wrap-anywhere">{userName}</p>}
        <Button variant="secondary" onClick={logout}>Cerrar sesión</Button>
      </footer>
    </div>
  </div>
}
