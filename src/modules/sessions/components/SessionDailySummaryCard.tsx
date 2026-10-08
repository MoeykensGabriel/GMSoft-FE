import { Link } from 'react-router-dom'
import { Badge, BUSINESS_TIME_ZONE, formatDateTime } from '../../core'
import type { SessionDailySummary } from '../services/dailySummaryService'
import { DailySummaryMoneyTable, DailySummaryStockTable } from './DailySummaryTables'

export function SessionDailySummaryCard({ session }: { session: SessionDailySummary }) {
  const time = (date: string) => formatDateTime(date, BUSINESS_TIME_ZONE)
  return <article className="ui-card min-w-0" aria-label={`Salida de ${session.driverName}, apertura ${time(session.openedAt)}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-t bg-brand px-4 py-3 text-white">
      <h2 className="text-base font-semibold">{session.driverName} · {session.zoneName}</h2>
      {!session.isClosed && <Badge>En la calle</Badge>}
    </header>
    <div className="flex min-w-0 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">{session.vehicleName} · {session.vehicleLicensePlate}</p>
          <p>Apertura: {time(session.openedAt)} · {session.kilometersAtOpen} km</p>
          {session.closedAt && <p>Cierre: {time(session.closedAt)} · {session.kilometersAtClose} km</p>}
          {session.receivedAt && <p>Rendición de efectivo: {time(session.receivedAt)}</p>}
          {session.notes && <p className="whitespace-pre-wrap break-words">Observaciones: {session.notes}</p>}
        </div>
        <Link to={`/panel/salidas/${session.sessionId}`} className="text-muted underline underline-offset-2">Ver detalle de la salida →</Link>
      </div>
      <DailySummaryMoneyTable money={session.money} isClosed={session.isClosed} label="Dinero de la salida" />
      {!session.isClosed && <p className="text-sm text-muted">A bordo es lo que sigue en el camión. El cuadre se confirma al recibirlo.</p>}
      <DailySummaryStockTable products={session.products} totals={session.totals} isClosed={session.isClosed} label="Productos de la salida" />
    </div>
  </article>
}
