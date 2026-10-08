import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BUSINESS_TIME_ZONE, Button, DataTable, ErrorMessage, LinkButton, Page, PageHeader, Panel, formatDateTime } from '../../core'
import { driverService } from '../../drivers'
import { promotionService } from '../services/promotionService'
import { PromotionSummary } from '../components/PromotionSummary'

export function PromotionDetailView() {
  const { id = '' } = useParams()
  const detail = useQuery({ queryKey: ['promotions', 'detail', id], queryFn: () => promotionService.getById(id), enabled: Boolean(id) })
  const promotion = detail.data
  const closingDriver = useQuery({ queryKey: ['drivers', 'detail', promotion?.closedByDriverId],
    queryFn: () => driverService.getById(promotion!.closedByDriverId!), enabled: Boolean(promotion?.closedByDriverId),
  })
  return <Page className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
    <PageHeader title="Detalle de promoción" actions={<LinkButton to="/panel/promociones">Volver al listado</LinkButton>} />
    {detail.isPending ? <p role="status">Cargando promoción...</p> : detail.isError ? <>
      <ErrorMessage error={detail.error} /><Button variant="secondary" onClick={() => detail.refetch()}>Reintentar</Button>
    </> : promotion && <>
      <Panel title="Prospecto y registro">
        <PromotionSummary promotion={promotion} />
        <p className="text-sm">Registrada: {formatDateTime(promotion.registeredAt, BUSINESS_TIME_ZONE)} · {promotion.driverName}</p>
        <p className="text-sm">Vehículo: {promotion.vehicleName} · {promotion.vehicleLicensePlate}</p>
        <Link className="ui-link" to={`/panel/salidas/${encodeURIComponent(promotion.deliverySessionId)}`}>Ver salida de registro</Link>
      </Panel>
      <DataTable label="Productos y movimientos de envases de la promoción">
        <thead><tr><th scope="col">Producto</th><th scope="col">Cantidad</th><th scope="col">Prestados</th><th scope="col">Retirados</th><th scope="col">Perdidos</th></tr></thead>
        <tbody>{promotion.lines.map((line) => <tr key={line.productId}><td>{line.productDetail}</td><td>{line.quantity}</td><td>{line.containersLoaned}</td><td>{line.containersReturned}</td><td>{line.containersLost}</td></tr>)}</tbody>
      </DataTable>
      {promotion.closedAt && <Panel title="Cierre">
        <p>Fecha: {formatDateTime(promotion.closedAt, BUSINESS_TIME_ZONE)}</p>
        <p>Chofer: {closingDriver.data ? `${closingDriver.data.firstName} ${closingDriver.data.lastName}` : promotion.closedByDriverId ?? 'No informado'}</p>
        {closingDriver.isPending && promotion.closedByDriverId && <p role="status">Cargando nombre del chofer...</p>}
        {closingDriver.isError && <><ErrorMessage error={closingDriver.error} /><Button variant="secondary" onClick={() => closingDriver.refetch()}>Reintentar chofer</Button></>}
        {promotion.closingSessionId && <Link className="ui-link" to={`/panel/salidas/${encodeURIComponent(promotion.closingSessionId)}`}>Ver salida del cierre</Link>}
        {promotion.customerId && <><p>Los envases prestados pasaron al saldo del cliente.</p><Link className="ui-link" to={`/panel/clientes/${encodeURIComponent(promotion.customerId)}`}>Ver cliente resultante</Link></>}
      </Panel>}
    </>}
  </Page>
}
