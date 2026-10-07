import { formatDateTime, DataTable, LinkButton } from '../../core'
import type { ActiveDeparture } from '../services/sessionService'

export function ActiveDepartureSummary({ departure }: { departure: ActiveDeparture }) {
  const total = departure.initialLoad.reduce((sum, line) => sum + line.quantity, 0)
  return <article className="flex min-w-0 flex-col gap-4 ui-card p-4">
    <div>
      <h3 className="break-words font-semibold">{departure.vehicleName} · {departure.vehicleLicensePlate}</h3>
      <p className="mt-1 break-words text-sm">Chofer: {departure.driverName || 'Sin nombre registrado'}</p>
      <p className="break-words text-sm">Zona: {departure.zoneName || 'Sin nombre registrado'}</p>
      <p className="mt-1 text-xs text-muted">Salida: {formatDateTime(departure.openedAt, 'America/Argentina/Buenos_Aires')}</p>
    </div>
    <div className="min-w-0">
      <h4 className="mb-2 text-sm font-medium">Carga inicial · {total} unidades</h4>
      {departure.initialLoad.length === 0 ? <p className="text-sm text-muted">Sin carga inicial registrada.</p>
        : <DataTable label="Carga inicial del camión" className="w-full table-fixed text-sm">
          <thead><tr className="border-b border-line text-left"><th scope="col" className="py-2 font-medium">Producto</th><th scope="col" className="w-20 py-2 text-right font-medium">Cantidad</th></tr></thead>
          <tbody>{departure.initialLoad.map((line) => <tr key={line.productId} className="border-b border-line">
            <th scope="row" className="break-words py-2 pr-2 text-left font-normal">{line.productDetail}</th>
            <td className="py-2 text-right tabular-nums">{line.quantity}</td>
          </tr>)}</tbody>
        </DataTable>}
    </div>
    <LinkButton to={`/panel/salidas/${departure.sessionId}`} className="mt-auto self-start" aria-label={`Ver salida de ${departure.vehicleName} ${departure.vehicleLicensePlate}`}>Ver salida</LinkButton>
  </article>
}
