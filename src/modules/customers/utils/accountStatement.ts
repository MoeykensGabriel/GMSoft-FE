import { sortProducts } from '../../core'
import type { CustomerStatementEntry } from '../services/customerService'
import { noPurchaseLabel } from './noPurchase'
import { removalLabel } from './removal'

export function statementDetail(entry: CustomerStatementEntry) {
  const products = entry.lines.map((line) => `${line.quantity} × ${line.productDetail}`).join(' + ')
  const titles = {
    Sale: products || 'Venta',
    Promotion: products ? `Promoción · ${products}` : 'Promoción',
    ContainerOnly: 'Movimiento de envases',
    Loan: 'Préstamo',
    LoanReturn: 'Retiro de préstamo',
    NoPurchase: `No compró · ${noPurchaseLabel(entry.noPurchaseReason)}`,
    Payment: 'Cobro de deuda',
    ContainerAdjustment: 'Ajuste de envases',
    ContainerLoss: 'Pérdida de envases',
    RemovalRequested: `Baja pedida por el chofer · ${removalLabel(entry.removalReason)}`,
    RemovalConfirmed: `Baja confirmada · ${removalLabel(entry.removalReason)}`,
    RemovalRejected: `Baja rechazada: sigue en el recorrido`,
  }
  const containers = new Map<string, { name: string; delivered: number; returned: number }>()
  for (const line of [...entry.containersDelivered, ...entry.containersReturned]) {
    containers.set(line.productId, { name: line.productDetail, delivered: 0, returned: 0 })
  }
  for (const line of entry.containersDelivered) containers.get(line.productId)!.delivered += line.quantity
  for (const line of entry.containersReturned) containers.get(line.productId)!.returned += line.quantity
  const details = sortProducts([...containers.values()], (p) => p.name).map((line) =>
    `${containers.size > 1 ? `${line.name}: ` : ''}dejó ${line.delivered} · devolvió ${line.returned}`,
  )
  for (const exchange of entry.containerExchanges ?? []) {
    const destination = exchange.notes?.replace(/^Cambio por /, '')
    details.push(`Cambio de envase: devolvió ${exchange.quantity} vacío${exchange.quantity === 1 ? '' : 's'} de ${exchange.productDetail}${destination ? ` y se llevó ${destination}` : ''}`)
  }
  for (const change of entry.containerChanges) {
    details.push(`${change.productDetail}: ${change.quantity > 0 ? '+' : ''}${change.quantity}${change.reason ? ` · ${change.reason}` : ''}`)
  }
  return { title: titles[entry.kind], details }
}
