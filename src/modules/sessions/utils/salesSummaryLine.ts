import { formatMoney } from '../../core'
import type { SalesSummary } from '../services/sessionService'

export function salesSummaryLine({ cash, transfer, card, sales }: Pick<SalesSummary, 'cash' | 'transfer' | 'card' | 'sales'>): string {
  if (sales === 0) return ''

  return [
    ...(cash > 0 ? [`Efectivo ${formatMoney(cash)}`] : []),
    ...(transfer > 0 ? [`Transf. ${formatMoney(transfer)}`] : []),
    `${sales} ${sales === 1 ? 'venta' : 'ventas'}`,
    ...(card > 0 ? [`Tarjeta ${formatMoney(card)}`] : []),
  ].join(' · ')
}
