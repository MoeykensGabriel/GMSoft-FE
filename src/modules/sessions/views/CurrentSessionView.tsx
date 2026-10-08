import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CustomerRouteList } from '../../customers'
import { useAuth } from '../../auth'
import { RouteHeader } from '../components/RouteHeader'
import { Button, formatDateTime, LinkButton, Page } from '../../core'
import type { Session } from '../services/sessionService'

type Modo = 'ventas' | 'promociones'

const MODO_KEY = 'gmsoft.reparto.modo'

// El modo se recuerda por pestaña: al volver de una venta o de una promoción el
// chofer cae en la misma pantalla, sin pasar otra vez por el menú.
function leerModo(): Modo | null {
  try {
    const guardado = window.sessionStorage.getItem(MODO_KEY)
    return guardado === 'ventas' || guardado === 'promociones' ? guardado : null
  } catch {
    return null
  }
}

function guardarModo(modo: Modo | null) {
  try {
    if (modo) window.sessionStorage.setItem(MODO_KEY, modo)
    else window.sessionStorage.removeItem(MODO_KEY)
  } catch {
    // Sin almacenamiento el modo vive solo en memoria.
  }
}

/** La salida en curso: con que salio, donde reparte y que tiene a bordo ahora. */
export function CurrentSessionView({ sesion, promotions }: { sesion: Session; promotions?: ReactNode }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [modo, setModo] = useState<Modo | null>(leerModo)
  const elegir = (nuevo: Modo | null) => { guardarModo(nuevo); setModo(nuevo) }
  return (
    <Page className="mx-auto flex max-w-3xl flex-col gap-3 p-3">
      <RouteHeader zoneName={sesion.zoneName ?? 'Zona'} date={sesion.openedAt} userName={user?.userName ?? sesion.driverName} routeDays={sesion.routeDays} />
      {modo === null && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="navigation" className="min-h-14" onClick={() => elegir('ventas')}>Vender</Button>
          <Button variant="primary" className="min-h-14" onClick={() => elegir('promociones')}>Promociones</Button>
        </div>
      )}
      {modo !== null && <Button variant="secondary" onClick={() => elegir(null)}>← Menú principal</Button>}
      {modo === 'ventas' && <>
        <LinkButton to="/reparto/visita?new=1" variant="primary" className="min-h-14">+ Agregar cliente</LinkButton>
        <CustomerRouteList vehicleId={sesion.vehicleId} zoneId={sesion.zoneId} routeDays={sesion.routeDays} deferredCustomerIds={sesion.deferredCustomerIds} onSelect={(id) => navigate(`/reparto/clientes/${encodeURIComponent(id)}`)} />
      </>}
      {modo === 'promociones' && <>
        <LinkButton to="/reparto/promocion" variant="primary" className="min-h-14">+ Registrar promoción</LinkButton>
        {promotions}
      </>}
      <details className="ui-card p-3">
        <summary className="cursor-pointer py-1 text-sm font-medium">Vehículo y carga a bordo</summary>
      <div className="mt-3">
        <p className="mt-1 text-sm text-muted">
          {sesion.zoneName} · {sesion.vehicleName} ({sesion.vehicleLicensePlate})
        </p>
        <p className="text-sm text-muted">
          Abierta {formatDateTime(sesion.openedAt)} · {sesion.kilometersAtOpen} km
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">A bordo</span>

        {sesion.stock.length === 0 ? (
          <p className="text-sm text-muted">Saliste sin carga.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sesion.stock.map((l) => (
              <li
                key={l.productId}
                className="flex justify-between ui-card px-3 py-2 text-sm"
              >
                <span className="text-muted">{l.productDetail}</span>
                <span className="text-ink">
                  {l.fullOnBoard} llenos
                  {l.emptyOnBoard > 0 && ` · ${l.emptyOnBoard} vacíos`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      </details>

      <p className="text-xs text-muted">
        Tu salida sigue abierta hasta que ADMIN reciba este camión. Después de la recepción, volverás automáticamente al login.
      </p>
    </Page>
  )
}
