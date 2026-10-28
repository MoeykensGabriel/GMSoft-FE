import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BUSINESS_TIME_ZONE, formatDateTime, formatMoney } from '../../core'
import { sessionService } from '../services/sessionService'

/**
 * Aviso del Home: salidas recibidas con «la plata llega después» que todavía no se
 * rindieron, del día que sean. Sin esto solo se ven entrando a cada salida, y la plata
 * de un día se puede olvidar al siguiente.
 */
export function PendingSettlementsNotice() {
  const pending = useQuery({
    queryKey: ['sessions', 'pending-settlements'], queryFn: sessionService.getPendingSettlements,
    refetchInterval: 60_000,
  })
  const items = pending.data ?? []
  if (items.length === 0) return null
  return <div role="status" className="rounded border border-warning/40 bg-warning-soft p-4 text-warning">
    <p className="font-semibold">{items.length === 1 ? '1 salida recibida sin rendir' : `${items.length} salidas recibidas sin rendir`}</p>
    <p className="text-sm">Cuando el chofer entregue la plata, cargala en la liquidación de la salida.</p>
    <ul className="mt-3 flex flex-col gap-3">
      {items.map((p) => <li key={p.sessionId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-ink">
        <span className="min-w-0">
          <span className="font-semibold">{p.driverName}</span> · {p.zoneName} · {p.vehicleName} ({p.vehicleLicensePlate})
          <span className="block text-sm text-muted">
            Recibido {formatDateTime(p.closedAt, BUSINESS_TIME_ZONE)} · efectivo a entregar {formatMoney(p.cashToDeliver)}
          </span>
        </span>
        <Link className="underline" to={`/panel/salidas/${p.sessionId}#liquidacion`}>Cargar la plata</Link>
      </li>)}
    </ul>
  </div>
}
