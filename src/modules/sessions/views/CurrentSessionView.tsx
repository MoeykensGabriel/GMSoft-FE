import { orderedZones, zonesLabel } from '../../zones'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { CustomerRouteList, OutOfRouteSearch, RouteUpdateNotice, useRouteLater } from '../../customers'
import { useAuth } from '../../auth'
import { RouteHeader } from '../components/RouteHeader'
import { Button, formatDateTime, InstallAppButton, LinkButton, Page, useOutbox, BackButton } from '../../core'
import { sessionService } from '../services/sessionService'
import type { Session } from '../services/sessionService'
import { RestocksPanel } from '../components/RestocksPanel'
import { RestockNotice } from '../components/RestockNotice'
import { OutboxNotice } from '../components/OutboxNotice'
import { SalesSoFarCard } from '../components/SalesSoFarCard'

type Modo = 'ventas' | 'promociones' | 'pedidos'

const MODO_KEY = 'gmsoft.reparto.modo'

// El modo se recuerda por pestaña: al volver de una venta o de una promoción el
// chofer cae en la misma pantalla, sin pasar otra vez por el menú.
function leerModo(): Modo | null {
  try {
    const guardado = window.sessionStorage.getItem(MODO_KEY)
    return guardado === 'ventas' || guardado === 'promociones' || guardado === 'pedidos' ? guardado : null
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
  const location = useLocation()
  const { user } = useAuth()
  const [modo, setModo] = useState<Modo | null>(() => {
    if (location.state?.modo === 'pedidos') { guardarModo('pedidos'); return 'pedidos' }
    return leerModo()
  })
  const elegir = (nuevo: Modo | null) => { guardarModo(nuevo); setModo(nuevo) }
  // Las visitas ya hechas en esta salida: la lista de pendientes se acorta con cada una.
  const visitas = useQuery({
    queryKey: ['sessions', 'deliveries', sesion.id],
    queryFn: () => sessionService.getDeliveries(sesion.id),
    refetchInterval: 30_000,
    staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true, refetchOnReconnect: true,
  })
  // Lo guardado en el celular de esta salida cuenta como visitado: no hay que volver a atenderlo.
  const bandeja = useOutbox(user?.userId ?? '')
  const guardadas = bandeja.filter((item) => item.sessionId === sesion.id && item.status === 'pending')
  const visitados = [...new Set([...(visitas.data ?? []).map((visita) => visita.customerId),
    ...guardadas.flatMap((item) => item.customerId ? [item.customerId] : [])])]
  const masTarde = useRouteLater(sesion.id)
  return (
    <Page className="mx-auto flex max-w-3xl flex-col gap-3 p-3">
      {location.state?.routeSaved && <p role="status" className="ui-card p-3">Recorrido guardado</p>}
      {user && <RestockNotice userId={user.userId} session={sesion} />}
      {user && <OutboxNotice userId={user.userId} items={bandeja.filter((item) => item.sessionId === sesion.id || item.status === 'failed')} />}
      <RouteUpdateNotice key={sesion.id} vehicleId={sesion.vehicleId} zones={orderedZones(sesion)} routeDays={sesion.routeDays} />
      <RouteHeader zoneName={zonesLabel(sesion)} date={sesion.openedAt} userName={user?.userName ?? sesion.driverName} routeDays={sesion.routeDays} />
      {modo === null && (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="navigation" className="min-h-14 px-2" onClick={() => elegir('ventas')}>Vender</Button>
          <Button variant="primary" className="min-h-14 px-2" onClick={() => elegir('promociones')}>Promociones</Button>
          <Button variant="warning" className="min-h-14 px-2" onClick={() => elegir('pedidos')}>Pedidos</Button>
        </div>
      )}
      {modo !== null && <BackButton onClick={() => elegir(null)} label="Volver al menú principal" />}
      {modo === 'ventas' && <>
        <LinkButton to="/reparto/visita?new=1" variant="primary" className="min-h-14">+ Agregar cliente</LinkButton>
        <LinkButton to="/reparto/organizar" variant="secondary" className="min-h-14">Organizar recorrido</LinkButton>
        {/* Sin las visitas no se sabe quién ya fue atendido: mejor avisar que mostrar a todos como pendientes. */}
        {visitas.isError && <div role="alert" className="flex flex-col gap-2 rounded border border-danger/30 bg-danger-soft p-3 text-sm">
          <p>No se pudieron leer las visitas de hoy. La lista puede mostrar como pendientes a clientes ya visitados.</p>
          <Button variant="secondary" onClick={() => void visitas.refetch()}>Reintentar</Button>
        </div>}
        <CustomerRouteList vehicleId={sesion.vehicleId} zones={orderedZones(sesion)} routeDays={sesion.routeDays} noPurchaseReasons={Object.fromEntries((visitas.data ?? []).flatMap((v) => v.type === 'NoPurchase' && v.noPurchaseReason ? [[v.customerId, v.noPurchaseReason]] : []))} visitedCustomerIds={visitados} laterCustomerIds={masTarde} onSelect={(id) => navigate(`/reparto/clientes/${encodeURIComponent(id)}`)} />
      </>}
      {modo === 'promociones' && <>
        <LinkButton to="/reparto/promocion" variant="primary" className="min-h-14">+ Registrar promoción</LinkButton>
        {promotions}
      </>}
      {modo === 'pedidos' && <OutOfRouteSearch key={sesion.id} sessionId={sesion.id} onConfirm={(id) => navigate(`/reparto/visita?customerId=${encodeURIComponent(id)}&fueraDeDia=1`)} />}
      {(modo === 'ventas' || modo === 'pedidos') && <SalesSoFarCard key={sesion.id} sessionId={sesion.id} />}
      <details className="ui-card p-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Vehículo y carga a bordo</summary>
      <div className="mt-3">
        <p className="mt-1 text-sm text-muted">
          {zonesLabel(sesion)} · {sesion.vehicleName} ({sesion.vehicleLicensePlate})
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
      <RestocksPanel restocks={sesion.restocks} />
      </details>

      <InstallAppButton />

      <p className="text-xs text-muted">
        Tu salida sigue abierta hasta que ADMIN reciba este camión. Después de la recepción, volverás automáticamente al login.
      </p>
    </Page>
  )
}
