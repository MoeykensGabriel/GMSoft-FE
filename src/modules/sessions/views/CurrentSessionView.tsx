import { useNavigate } from 'react-router-dom'
import { CustomerRouteList } from '../../customers'
import { useAuth } from '../../auth'
import { RouteHeader } from '../components/RouteHeader'
import { formatDateTime, LinkButton, Page } from '../../core'
import type { Session } from '../services/sessionService'

/** La salida en curso: con que salio, donde reparte y que tiene a bordo ahora. */
export function CurrentSessionView({ sesion }: { sesion: Session }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  return (
    <Page className="mx-auto flex max-w-3xl flex-col gap-3 p-3">
      <RouteHeader zoneName={sesion.zoneName ?? 'Zona'} date={sesion.openedAt} userName={user?.userName ?? sesion.driverName} routeDays={sesion.routeDays} />
      <LinkButton to="/reparto/visita?new=1" variant="primary" className="min-h-14">+ Agregar cliente</LinkButton>
      <CustomerRouteList vehicleId={sesion.vehicleId} zoneId={sesion.zoneId} routeDays={sesion.routeDays} deferredCustomerIds={sesion.deferredCustomerIds} onSelect={(id) => navigate(`/reparto/clientes/${encodeURIComponent(id)}`)} />
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
