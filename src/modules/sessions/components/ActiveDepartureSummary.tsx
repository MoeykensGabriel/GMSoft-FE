import { formatDateTime, DataTable, LinkButton } from '../../core'
import type { ActiveDeparture } from '../services/sessionService'
import { departureRows, stockTone } from '../utils/departureStock'

const toneClass = { empty: 'bg-danger-soft text-danger', low: 'bg-warning-soft text-warning', ok: '' } as const

/**
 * Un camión en la calle, a todo el ancho: con qué salió, qué le recargaron, cuánto
 * entregó y qué lleva a bordo ahora. Los llenos que se están por terminar se marcan.
 */
export function ActiveDepartureSummary({ departure }: { departure: ActiveDeparture }) {
  const filas = departureRows(departure)
  const total = (campo: keyof (typeof filas)[number]) => filas.reduce((sum, f) => sum + Number(f[campo] ?? 0), 0)
  return <article className="flex min-w-0 flex-col gap-4 ui-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="break-words text-lg font-semibold">{departure.vehicleName} · {departure.vehicleLicensePlate}</h3>
        <p className="break-words text-sm">
          Chofer: <strong>{departure.driverName || 'Sin nombre registrado'}</strong>
          {' · '}{departure.zoneName.includes(' → ') ? 'Zonas' : 'Zona'}: <strong>{departure.zoneName || 'Sin nombre registrado'}</strong>
        </p>
        <p className="text-sm text-muted">Salió: {formatDateTime(departure.openedAt, 'America/Argentina/Buenos_Aires')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <LinkButton to={`/panel/salidas/${departure.sessionId}`} aria-label={`Ver salida de ${departure.vehicleName} ${departure.vehicleLicensePlate}`}>Ver salida</LinkButton>
        <LinkButton to={`/panel/salidas/${departure.sessionId}/recarga`} variant="navigation" aria-label={`Recargar ${departure.vehicleName} ${departure.vehicleLicensePlate}`}>Recargar</LinkButton>
        <LinkButton to={`/panel/salidas/${departure.sessionId}/recepcion`} variant="primary" aria-label={`Recibir ${departure.vehicleName} ${departure.vehicleLicensePlate}`}>Recibir</LinkButton>
      </div>
    </div>
    {filas.length === 0 ? <p className="text-sm text-muted">Sin carga inicial registrada.</p>
      : <div className="overflow-x-auto">
        <DataTable stack={false} label={`Carga de ${departure.vehicleName}`} className="w-full min-w-[36rem] text-sm">
          <thead><tr className="border-b border-line text-left">
            <th scope="col" className="py-2 font-medium">Producto</th>
            <th scope="col" className="py-2 text-right font-medium">Salió</th>
            <th scope="col" className="py-2 text-right font-medium">Recargas</th>
            <th scope="col" className="py-2 text-right font-medium">Entregados</th>
            <th scope="col" className="py-2 text-right font-semibold">Llenos a bordo</th>
            <th scope="col" className="py-2 text-right font-medium">Vacíos a bordo</th>
          </tr></thead>
          <tbody>{filas.map((f) => <tr key={f.productId} className="border-b border-line">
            <th scope="row" className="break-words py-2 pr-2 text-left font-normal">{f.productDetail}</th>
            <td className="py-2 text-right tabular-nums">{f.initial}</td>
            <td className="py-2 text-right tabular-nums">{f.restocked || '—'}</td>
            <td className="py-2 text-right tabular-nums">{f.delivered}</td>
            <td className={`py-2 text-right text-base font-bold tabular-nums ${toneClass[stockTone(f)]}`}>{f.fullOnBoard}</td>
            <td className="py-2 text-right tabular-nums">{f.emptyOnBoard}</td>
          </tr>)}</tbody>
          <tfoot><tr className="font-semibold">
            <th scope="row" className="py-2 text-left">Total</th>
            <td className="py-2 text-right tabular-nums">{total('initial')}</td>
            <td className="py-2 text-right tabular-nums">{total('restocked') || '—'}</td>
            <td className="py-2 text-right tabular-nums">{total('delivered')}</td>
            <td className="py-2 text-right text-base tabular-nums">{total('fullOnBoard')}</td>
            <td className="py-2 text-right tabular-nums">{total('emptyOnBoard')}</td>
          </tr></tfoot>
        </DataTable>
      </div>}
  </article>
}
