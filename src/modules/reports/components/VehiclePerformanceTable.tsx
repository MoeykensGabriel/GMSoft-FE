import type { ReactNode } from 'react'
import { DataTable, formatMoney } from '../../core'
import { noPurchaseLabel, NO_PURCHASE_REASONS } from '../../customers'
import type { NoPurchaseReason } from '../../customers'
import type { VehiclePerformance } from '../services/vehiclePerformanceService'
import { formatPercent } from '../utils/format'

const detail = 'block text-xs text-muted'
const money = (value: number | null) => value === null ? '—' : formatMoney(value)
const number = (value: number) => value.toLocaleString('es-AR')

function mainReason(vehicle: VehiclePerformance) {
  const principal = Object.entries(vehicle.noPurchase.byReason).sort(([a, x], [b, y]) => y - x || a.localeCompare(b))[0]
  if (!principal) return null
  const reason = Object.hasOwn(NO_PURCHASE_REASONS, principal[0]) ? principal[0] as NoPurchaseReason : null
  return `${noPurchaseLabel(reason)} (${principal[1]})`
}

/** Un indicador por fila y un camión por columna: los camiones se comparan uno al lado del otro. */
const ROWS: { label: string; cell: (vehicle: VehiclePerformance) => ReactNode }[] = [
  { label: 'Salidas', cell: (v) => <>{v.sessions}<span className={detail}>{v.closedSessions} cerradas</span></> },
  { label: 'Vendido', cell: (v) => <span className="font-semibold">{money(v.sold)}</span> },
  { label: 'Cobrado', cell: (v) => <>{money(v.collected)}<span className={detail}>{formatPercent(v.collectedPercent)} cobrado</span>
    <span className={detail}>Efectivo {money(v.collectedByMethod.cash)}</span>
    <span className={detail}>Transferencia {money(v.collectedByMethod.transfer)}</span>
    {v.collectedByMethod.card > 0 && <span className={detail}>Tarjeta {money(v.collectedByMethod.card)}</span>}</> },
  { label: 'Quedó a cuenta', cell: (v) => <span className={v.onAccount > 0 ? 'font-semibold text-warning' : ''}>{money(v.onAccount)}</span> },
  { label: 'Clientes', cell: (v) => <>{v.routeCustomers} en el recorrido<span className={detail}>{v.visitedCustomers} visitados · {v.buyingCustomers} compraron</span>
    <span className={detail}>{formatPercent(v.buyingPercent)} de compra</span></> },
  { label: 'Ventas', cell: (v) => <>{v.sales}<span className={detail}>Ticket promedio {money(v.averageTicket)}</span></> },
  { label: 'No compró', cell: (v) => <>{v.noPurchase.total}<span className={detail}>{mainReason(v) ?? '—'}</span></> },
  { label: 'Unidades vendidas', cell: (v) => v.unitsByProduct.length
    ? v.unitsByProduct.map((product) => <span key={product.productId} className="block">{product.productDetail}: {number(product.units)}</span>)
    : <span className={detail}>0 unidades</span> },
  { label: 'Faltantes al recibir', cell: (v) => (['full', 'empty'] as const).map((kind) =>
    <span key={kind} className={`block ${v.shortages[kind] > 0 ? 'font-semibold text-danger' : ''}`}>
      {kind === 'full' ? 'Llenos' : 'Vacíos'}: {number(v.shortages[kind])}{v.shortages[kind] < 0 ? ' (sobrante)' : ''}
    </span>) },
  { label: 'Diferencia de caja', cell: (v) => <><span className={v.cashDifference > 0 ? 'font-semibold text-danger' : ''}>{money(v.cashDifference)}</span>
    <span className={detail}>{v.cashDifference > 0 ? 'Falta efectivo' : v.cashDifference < 0 ? 'Sobra efectivo' : 'Sin diferencia'}</span></> },
  { label: 'Kilómetros', cell: (v) => <>{number(v.kilometers)} km<span className={detail}>{money(v.soldPerKilometer)} vendido por km</span></> },
]

export function VehiclePerformanceTable({ vehicles }: { vehicles: VehiclePerformance[] }) {
  return <DataTable label="Comparativa de rendimiento por camión">
    <thead><tr>
      <th scope="col" className="w-48">Indicador</th>
      {vehicles.map((v) => <th key={v.vehicleId} scope="col" data-label={`${v.vehicleName.split(' ').slice(-1)[0]} · ${v.licensePlate || '—'}`}>
        {v.vehicleName} · {v.licensePlate || '—'}
        <span className="block text-xs font-normal">{v.driverNames.join(', ') || (v.sessions === 0 ? 'Sin salidas' : '—')}</span>
      </th>)}
    </tr></thead>
    <tbody>{ROWS.map((row) => <tr key={row.label}>
      <th scope="row" className="font-semibold">{row.label}</th>
      {vehicles.map((v) => <td key={v.vehicleId} className={`tabular-nums ${v.sessions === 0 ? 'text-muted' : ''}`}>{row.cell(v)}</td>)}
    </tr>)}</tbody>
  </DataTable>
}
