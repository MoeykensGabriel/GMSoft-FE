import { useQuery } from '@tanstack/react-query'
import { LinkButton, formatMoney } from '../../core'
import { sessionService } from '../services/sessionService'
import { pendingSettlementsLabel, totalPendingCash } from '../utils/pendingSettlements'

export function PendingSettlementsCard() {
  const pending = useQuery({
    queryKey: ['sessions', 'pending-settlements'], queryFn: sessionService.getPendingSettlements,
    refetchInterval: 60_000,
  })
  const items = pending.data ?? []
  if (!items.length) return null

  return <div role="status" className="flex min-w-0 flex-col gap-3 rounded border border-warning/40 bg-warning-soft p-4 text-warning sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0 wrap-anywhere">
      <h2 className="font-semibold">Rendiciones pendientes</h2>
      <div className="text-sm">{pendingSettlementsLabel(items.length)}</div>
      <div className="text-sm tabular-nums">Efectivo a entregar {formatMoney(totalPendingCash(items))}</div>
    </div>
    <LinkButton variant="navigation" className="shrink-0" to="/panel/rendiciones">Revisar</LinkButton>
  </div>
}
