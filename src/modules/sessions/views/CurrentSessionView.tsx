import { Link, useNavigate } from 'react-router-dom'
import { CustomerRouteList } from '../../customers'
import { useAuth } from '../../auth'
import { RouteHeader } from '../components/RouteHeader'
import { formatDateTime } from '../../core'
import type { Session } from '../services/sessionService'

/** La salida en curso: con que salio, donde reparte y que tiene a bordo ahora. */
export function CurrentSessionView({ sesion }: { sesion: Session }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-3">
      <RouteHeader zoneName={sesion.zoneName ?? 'Zona'} date={new Date().toISOString()} userName={user?.userName ?? sesion.driverName} routeDays={sesion.routeDays} />
      <Link to="/reparto/visita?new=1" className="flex min-h-14 items-center justify-center rounded-md bg-green-700 px-4 py-3 text-center font-medium text-white hover:bg-green-800">+ Agregar cliente</Link>
      <CustomerRouteList zoneId={sesion.zoneId} routeDays={sesion.routeDays} onSelect={(id) => navigate(`/reparto/visita?customerId=${encodeURIComponent(id)}`)} />
      <details className="rounded-md border border-neutral-300 p-3">
        <summary className="cursor-pointer py-1 text-sm font-medium">Vehículo y carga a bordo</summary>
      <div className="mt-3">
        <p className="mt-1 text-sm text-neutral-600">
          {sesion.zoneName} · {sesion.vehicleName} ({sesion.vehicleLicensePlate})
        </p>
        <p className="text-sm text-neutral-500">
          Abierta {formatDateTime(sesion.openedAt)} · {sesion.kilometersAtOpen} km
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-700">A bordo</span>

        {sesion.stock.length === 0 ? (
          <p className="text-sm text-neutral-500">Saliste sin carga.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sesion.stock.map((l) => (
              <li
                key={l.productId}
                className="flex justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <span className="text-neutral-700">{l.productDetail}</span>
                <span className="text-neutral-900">
                  {l.fullOnBoard} llenos
                  {l.emptyOnBoard > 0 && ` · ${l.emptyOnBoard} vacíos`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      </details>

      <p className="text-xs text-neutral-500">
        Cuando volvés, la oficina cuenta lo que traés y cierra la salida.
      </p>
    </div>
  )
}
