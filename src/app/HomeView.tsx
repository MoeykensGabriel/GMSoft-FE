import { Link, Navigate } from 'react-router-dom'
import { ROLES, useAuth } from '../modules/auth'
import { Button } from '../modules/core'

/** Las secciones del panel, en el orden en que se usan al arrancar de cero. */
const SECCIONES = [
  {
    to: '/panel/liquidacion',
    titulo: 'Liquidación por reparto',
    detalle: 'Elegís camión y día, y sale cómo cerró',
  },
  {
    to: '/panel/salidas',
    titulo: 'Salidas de reparto',
    detalle: 'El recorrido del día, el faltante y la rendición',
  },
  {
    to: '/panel/catalogo',
    titulo: 'Catálogo',
    detalle: 'Qué se vende, a cuánto y cómo se sigue su envase',
  },
  {
    to: '/panel/zonas',
    titulo: 'Zonas de reparto',
    detalle: 'Las zonas entre las que elige el chofer al salir',
  },
]

/** Manda a cada rol a lo suyo. El chofer va derecho a su salida del dia. */
export function HomeView() {
  const { user, logout } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.roles.includes(ROLES.driver)) return <Navigate to="/reparto" replace />

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Panel</h1>
          <p className="text-sm text-slate-600">{user.fullName || user.userName}</p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Salir
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {SECCIONES.map((s) => (
          <li key={s.to}>
            <Link
              to={s.to}
              className="block rounded-md border border-slate-200 bg-white px-3 py-3 hover:bg-slate-50"
            >
              <span className="block text-sm font-medium text-slate-900">{s.titulo}</span>
              <span className="block text-xs text-slate-500">{s.detalle}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
