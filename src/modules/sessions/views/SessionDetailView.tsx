import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { formatDateTime, formatMoney, LinkButton, Page, PageHeader } from '../../core'
import { SettlementPanel } from '../components/SettlementPanel'
import { StockOnBoardPanel } from '../components/StockOnBoardPanel'
import { sessionService } from '../services/sessionService'
import { RestocksPanel } from '../components/RestocksPanel'

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

  if (sesion.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (!sesion.data) return <p className="p-6 text-danger">No se encontró la salida.</p>

  const s = sesion.data
  const cerrada = s.status === 'Closed'

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div>
        <Link to="/panel/salidas" className="text-sm text-muted hover:underline">
          ← Salidas
        </Link>
        <PageHeader title={<>
          {s.driverName} · {s.zoneName}
        </>} />
        <p className="text-sm text-muted">
          {s.vehicleName} ({s.vehicleLicensePlate})
        </p>
        <p className="text-sm text-muted">
          Salió {formatDateTime(s.openedAt)} con {s.kilometersAtOpen} km
          {s.closedAt && ` · Volvió ${formatDateTime(s.closedAt)} con ${s.kilometersAtClose} km`}
        </p>
      </div>

      {!cerrada && (
        <div className="flex flex-wrap gap-3">
        <LinkButton to={`/panel/salidas/${id}/recarga`} variant="primary">Recargar</LinkButton>
        <LinkButton to={`/panel/salidas/${id}/recepcion`} variant="primary">
          Recibir el camión
        </LinkButton>
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted">
          Recorrido ({recorrido.data?.length ?? 0} visitas)
        </h3>

        {recorrido.data?.length === 0 ? (
          <p className="text-sm text-muted">No visitó a nadie.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {recorrido.data?.map((v) => (
              <li key={v.deliveryId} className="ui-card bg-surface p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{v.customerName}</p>
                    <p className="text-xs text-muted">{v.customerAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink">{formatMoney(v.total)}</p>
                    <p className="text-xs text-muted">{formatDateTime(v.deliveredAt)}</p>
                  </div>
                </div>

                {v.items.length > 0 && (
                  <ul className="mt-2 border-t border-line pt-2 text-xs text-muted">
                    {v.items.map((i) => (
                      <li key={i.productId}>
                        {i.quantity} × {i.productDetail} a {formatMoney(i.unitPrice)}
                      </li>
                    ))}
                  </ul>
                )}

                {v.containers.length > 0 && (
                  <ul className="mt-1 text-xs text-muted">
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
      <RestocksPanel restocks={s.restocks} />

      <SettlementPanel sessionId={id} cerrada={cerrada} />
    </Page>
  )
}
