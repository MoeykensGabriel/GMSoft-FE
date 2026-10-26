import { zonesLabel } from '../../zones'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { BUSINESS_TIME_ZONE, Badge, formatDateTime, formatMoney, LinkButton, Page, PageHeader, Panel, BackButton } from '../../core'
import { OutsideWorkingHoursBadge, OutsideWorkingHoursEvents } from '../../workingHours'
import { noPurchaseLabel } from '../../customers'
import { CancelSessionAction } from '../components/CancelSessionAction'
import { ReceptionCorrectionsPanel } from '../components/ReceptionCorrectionsPanel'
import { RestocksPanel } from '../components/RestocksPanel'
import { SettlementPanel } from '../components/SettlementPanel'
import { StatTile } from '../../core'
import { StockOnBoardPanel } from '../components/StockOnBoardPanel'
import { UnvisitedCustomersPanel } from '../components/UnvisitedCustomersPanel'
import { detailedSettlementQuery } from '../hooks/detailedSettlementQuery'
import { sessionService } from '../services/sessionService'
import type { SessionDelivery } from '../services/sessionService'

type Filtro = 'todas' | 'ventas' | 'transferencia' | 'cuenta' | 'sinCompra'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'transferencia', label: 'Con transferencia' },
  { id: 'cuenta', label: 'A cuenta' },
  { id: 'sinCompra', label: 'No compraron' },
]

/** Un renglón por producto: lo que dejó y lo que retiró van juntos. */
function envasesPorProducto(visita: SessionDelivery) {
  const porProducto = new Map<string, { detalle: string; dejo: number; retiro: number }>()
  for (const envase of visita.containers) {
    const fila = porProducto.get(envase.productId) ?? { detalle: envase.productDetail, dejo: 0, retiro: 0 }
    if (envase.quantity > 0) fila.dejo += envase.quantity
    else fila.retiro += -envase.quantity
    porProducto.set(envase.productId, fila)
  }
  return [...porProducto.values()]
}

/**
 * El dia de un chofer: con que salio, a quien visito y en que orden, que quedo a
 * bordo al cerrar y como rindio la plata.
 */
export function SessionDetailView() {
  const { id = '' } = useParams()
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const sesion = useQuery({
    queryKey: ['sessions', 'detail', id],
    queryFn: () => sessionService.getById(id),
  })

  const recorrido = useQuery({
    queryKey: ['sessions', 'deliveries', id],
    queryFn: () => sessionService.getDeliveries(id),
  })

  // Con qué pagó cada cliente: el recorrido trae la venta, no el cobro.
  const cobros = useQuery(detailedSettlementQuery(id))

  const sinVisitar = useQuery({
    queryKey: ['sessions', 'unvisited-customers', id],
    queryFn: () => sessionService.getUnvisitedCustomers(id),
    staleTime: 0, refetchInterval: 30_000,
  })

  if (sesion.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (!sesion.data) return <p className="p-6 text-danger">No se encontró la salida.</p>

  const s = sesion.data
  const cerrada = s.status === 'Closed'
  const visitas = recorrido.data ?? []
  const pagoDe = new Map((cobros.data ?? []).map((c) => [c.customerId, c]))
  const ventas = visitas.filter((v) => v.type !== 'NoPurchase' && v.items.length > 0)
  const sinCompra = visitas.filter((v) => v.type === 'NoPurchase')
  const cobrado = (cobros.data ?? []).reduce(
    (suma, c) => ({ cash: suma.cash + c.cash, transfer: suma.transfer + c.transfer, card: suma.card + c.card }),
    { cash: 0, transfer: 0, card: 0 })

  /** Lo que el cliente pagó en esta salida y cuánto de esta visita quedó sin cobrar. */
  const cobroDe = (v: SessionDelivery) => {
    const pago = pagoDe.get(v.customerId)
    const pagado = pago ? pago.cash + pago.transfer + pago.card : 0
    return { pago, pagado, aCuenta: v.type === 'Sale' ? Math.max(0, v.total - pagado) : 0 }
  }

  const mostradas = visitas.filter((v) => {
    if (filtro === 'todas') return true
    if (filtro === 'sinCompra') return v.type === 'NoPurchase'
    if (v.type === 'NoPurchase' || v.items.length === 0) return false
    if (filtro === 'ventas') return true
    const { pago, aCuenta } = cobroDe(v)
    return filtro === 'transferencia' ? (pago?.transfer ?? 0) > 0 : aCuenta > 0
  })

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <BackButton to="/panel/salidas" label="Volver a Salidas" />

      <div className="flex flex-col gap-2">
        <PageHeader title={<>{s.driverName} · {zonesLabel(s)}</>} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-ink">
          <Badge tone={cerrada ? 'neutral' : 'warning'}>{cerrada ? 'Camión recibido' : 'En la calle'}</Badge>
          <span className="font-medium">{s.vehicleName} · {s.vehicleLicensePlate}</span>
          <span className="text-muted">Salió {formatDateTime(s.openedAt, BUSINESS_TIME_ZONE)} con {s.kilometersAtOpen} km <OutsideWorkingHoursBadge marked={s.openedOutsideWorkingHours} /></span>
          {s.closedAt && <span className="text-muted">Volvió {formatDateTime(s.closedAt, BUSINESS_TIME_ZONE)} con {s.kilometersAtClose} km <OutsideWorkingHoursBadge marked={s.closedOutsideWorkingHours} /></span>}
        </div>
      </div>

      <OutsideWorkingHoursEvents events={s.outsideWorkingHoursEvents} />
      <p className="ui-card p-3 text-sm">{s.driverRouteOrderChange
        ? `El chofer reordenó el recorrido: ${s.driverRouteOrderChange.changedByUserName ?? s.driverName}, ${formatDateTime(s.driverRouteOrderChange.changedAt, BUSINESS_TIME_ZONE)} · ${s.driverRouteOrderChange.movedCount} clientes cambiaron de lugar.`
        : 'El chofer no reordenó el recorrido en esta salida.'}</p>

      {!cerrada && (
        <div className="flex flex-wrap gap-3">
          <LinkButton to={`/panel/salidas/${id}/recepcion`} variant="primary">Recibir el camión</LinkButton>
          <LinkButton to={`/panel/salidas/${id}/recarga`} variant="secondary">Recargar</LinkButton>
          <CancelSessionAction sessionId={id} driverName={s.driverName} />
        </div>
      )}
      {cerrada && !s.isSettled && (
        <p role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded border border-warning/40 bg-warning-soft px-4 py-3 text-base font-semibold text-warning">
          Falta rendir el efectivo de esta salida.
          <a href="#liquidacion" className="text-sm text-ink underline">Cargar la plata</a>
        </p>
      )}
      {cerrada && (
        <LinkButton to={`/panel/salidas/${id}/correccion`} variant="secondary" className="self-start">
          Corregir recepción
        </LinkButton>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Visitas" value={visitas.length} detail={`${ventas.length} con venta`} />
        <StatTile label="Vendió" value={formatMoney(ventas.reduce((suma, v) => suma + v.total, 0))} />
        <StatTile label="No compraron" value={sinCompra.length} tone={sinCompra.length > 0 ? 'warning' : 'neutral'}
          detail={sinCompra.length > 0 ? 'El chofer pasó y no compraron' : 'Ninguno marcado'} />
        <StatTile label="Sin visitar" value={sinVisitar.data?.total ?? '…'} tone={(sinVisitar.data?.total ?? 0) > 0 ? 'danger' : 'neutral'}
          detail={cerrada ? 'El chofer no pasó' : 'Todavía pendientes'} />
      </div>

      <Panel title={`Recorrido (${visitas.length} visitas)`}>
        {visitas.length === 0 ? (
          <p className="text-muted">No visitó a nadie.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar visitas">
              {FILTROS.map((f) => (
                <button key={f.id} type="button" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}
                  className={`rounded border px-3 py-1.5 text-sm font-medium ${filtro === f.id
                    ? 'border-accent bg-accent-soft text-brand-dark' : 'border-line bg-surface text-muted hover:bg-canvas'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {mostradas.length === 0 && <p className="text-muted">Ninguna visita con ese filtro.</p>}

            <ol className="flex flex-col gap-3">
              {mostradas.map((v) => {
                const noCompro = v.type === 'NoPurchase'
                const { pago, pagado, aCuenta } = cobroDe(v)
                const envases = envasesPorProducto(v)
                return (
                  <li key={v.deliveryId} className={`rounded border px-4 py-3 ${noCompro
                    ? 'border-warning/40 border-l-4 border-l-warning bg-warning-soft' : 'border-line bg-surface'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-ink">
                          <span className="mr-2 text-muted">{visitas.indexOf(v) + 1}.</span>{v.customerName}
                        </p>
                        <p className="text-sm text-muted">{v.customerAddress} · {formatDateTime(v.deliveredAt, BUSINESS_TIME_ZONE)}</p>
                        <OutsideWorkingHoursBadge marked={v.isOutsideWorkingHours} />
                        {v.isOutOfRoute && <Badge tone="warning">Fuera de su día</Badge>}
                      </div>
                      {!noCompro && v.items.length > 0 && <p className="text-xl font-semibold text-ink">{formatMoney(v.total)}</p>}
                    </div>

                    {noCompro ? (
                      <p className="mt-2 text-base font-semibold text-warning">
                        No compró: {noPurchaseLabel(v.noPurchaseReason)}
                        {v.notes && <span className="ml-2 font-normal text-ink">«{v.notes}»</span>}
                      </p>
                    ) : (
                      <>
                        {v.items.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(pago?.cash ?? 0) > 0 && <Badge tone="neutral">Efectivo {formatMoney(pago!.cash)}</Badge>}
                            {(pago?.transfer ?? 0) > 0 && <Badge tone="info">Transferencia {formatMoney(pago!.transfer)}</Badge>}
                            {(pago?.card ?? 0) > 0 && <Badge tone="info">Tarjeta {formatMoney(pago!.card)}</Badge>}
                            {aCuenta > 0 && <Badge tone="warning">A cuenta {formatMoney(aCuenta)}</Badge>}
                            {pagado > v.total && <Badge tone="success">Pagó deuda anterior {formatMoney(pagado - v.total)}</Badge>}
                            {cobros.isPending && <span className="text-sm text-muted">Consultando cobro…</span>}
                          </div>
                        )}
                        {v.items.length === 0 && <p className="mt-2 text-sm font-medium text-muted">Solo envases y préstamos</p>}
                        {(v.loansOut ?? []).map((l) => <p key={`loan-${l.productId}`} className="mt-2 text-sm">Prestó {l.quantity} × {l.productDetail}</p>)}
                        {(v.loansIn ?? []).map((l) => <p key={`return-${l.productId}`} className="mt-2 text-sm">Retiró {l.quantity} × {l.productDetail}</p>)}
                        {v.items.length > 0 && (
                          <ul className="mt-2 border-t border-line pt-2 text-sm text-ink">
                            {v.items.map((i) => (
                              <li key={i.productId}>
                                <span className="font-semibold">{i.quantity}</span> × {i.productDetail} <span className="text-muted">a {formatMoney(i.unitPrice)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {envases.length > 0 && (
                          <ul className="mt-2 text-sm text-muted">
                            {envases.map((e) => (
                              <li key={e.detalle}>
                                Envases de {e.detalle}: {[e.dejo > 0 && `dejó ${e.dejo}`, e.retiro > 0 && `retiró ${e.retiro}`].filter(Boolean).join(' · ')}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </Panel>

      <UnvisitedCustomersPanel sessionId={id} />
      <StockOnBoardPanel stock={s.stock} cerrada={cerrada} />
      {cerrada && <ReceptionCorrectionsPanel sessionId={id} />}
      <RestocksPanel restocks={s.restocks} />
      <div id="liquidacion" className="scroll-mt-4">
        <SettlementPanel sessionId={id} cerrada={cerrada} byMethod={cobros.data ? cobrado : undefined} />
      </div>
    </Page>
  )
}
