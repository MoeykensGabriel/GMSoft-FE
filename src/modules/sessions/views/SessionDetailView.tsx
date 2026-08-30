import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { formatDateTime, formatMoney } from '../../core'
import { SettlementPanel } from '../components/SettlementPanel'
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

  // En una salida cerrada, lo que sigue figurando a bordo es el faltante: nunca se
  // descargo ni se entrego. Mientras esta abierta, es simplemente lo que lleva.
  const pendiente = s.stock.filter((l) => l.fullOnBoard !== 0 || l.emptyOnBoard !== 0)

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
        <h2 className="text-sm font-medium text-slate-700">
          Recorrido ({recorrido.data?.length ?? 0} visitas)
        </h2>

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

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-700">
          {cerrada ? 'Faltante al cerrar' : 'A bordo ahora'}
        </h2>

        {pendiente.length === 0 ? (
          <p
            className={`rounded-md border p-3 text-sm ${
              cerrada
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {cerrada ? 'Cuadró todo.' : 'Sin stock a bordo.'}
          </p>
        ) : (
          <ul
            className={`flex flex-col gap-1 rounded-md border p-3 text-sm ${
              cerrada ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
            }`}
          >
            {pendiente.map((l) => (
              <li key={l.productId} className="flex justify-between">
                <span className={cerrada ? 'text-red-700' : 'text-slate-700'}>
                  {l.productDetail}
                </span>
                <span className={cerrada ? 'text-red-800' : 'text-slate-900'}>
                  {l.fullOnBoard !== 0 && `${l.fullOnBoard} llenos`}
                  {l.fullOnBoard !== 0 && l.emptyOnBoard !== 0 && ' · '}
                  {l.emptyOnBoard !== 0 && `${l.emptyOnBoard} vacíos`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SettlementPanel sessionId={id} cerrada={cerrada} />
    </main>
  )
}
