import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { formatDateTime, formatMoney } from '../../core'
import { SettlementPanel } from '../components/SettlementPanel'
import { StockOnBoardPanel } from '../components/StockOnBoardPanel'
import { sessionService } from '../services/sessionService'

/**
 * El dia de un chofer: con que salio, a quien visito y en que orden, que quedo a
 * bordo al cerrar y como rindio la plata.
 */
export function SessionDetailView() {
  const { id = '' } = useParams()

  const sesion = useQuery({
    queryKey: ['sessions', 'detail', id],
    queryFn: () => sessionService.getById(id),
  })

  const recorrido = useQuery({
    queryKey: ['sessions', 'deliveries', id],
    queryFn: () => sessionService.getDeliveries(id),
  })

  if (sesion.isLoading) return <p className="p-6 text-slate-500">Cargando...</p>
  if (!sesion.data) return <p className="p-6 text-red-600">No se encontró la salida.</p>

  const s = sesion.data
  const cerrada = s.status === 'Closed'

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <Link to="/panel/salidas" className="text-sm text-slate-500 hover:underline">
          ← Salidas
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          {s.driverName} · {s.zoneName}
        </h1>
        <p className="text-sm text-slate-600">
          {s.vehicleName} ({s.vehicleLicensePlate})
        </p>
        <p className="text-sm text-slate-500">
          Salió {formatDateTime(s.openedAt)} con {s.kilometersAtOpen} km
          {s.closedAt && ` · Volvió ${formatDateTime(s.closedAt)} con ${s.kilometersAtClose} km`}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-slate-700">
          Recorrido ({recorrido.data?.length ?? 0} visitas)
        </h3>

        {recorrido.data?.length === 0 ? (
          <p className="text-sm text-slate-500">No visitó a nadie.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {recorrido.data?.map((v) => (
              <li key={v.deliveryId} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{v.customerName}</p>
                    <p className="text-xs text-slate-500">{v.customerAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{formatMoney(v.total)}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(v.deliveredAt)}</p>
                  </div>
                </div>

                {v.items.length > 0 && (
                  <ul className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
                    {v.items.map((i) => (
                      <li key={i.productId}>
                        {i.quantity} × {i.productDetail} a {formatMoney(i.unitPrice)}
                      </li>
                    ))}
                  </ul>
                )}

                {v.containers.length > 0 && (
                  <ul className="mt-1 text-xs text-slate-600">
                    {v.containers.map((c) => (
                      <li key={`${c.productId}-${c.quantity}`}>
                        {c.quantity > 0
                          ? `dejó ${c.quantity} envases`
                          : `retiró ${-c.quantity} vacíos`}{' '}
                        de {c.productDetail}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <StockOnBoardPanel stock={s.stock} cerrada={cerrada} />

      <SettlementPanel sessionId={id} cerrada={cerrada} />
    </main>
  )
}
