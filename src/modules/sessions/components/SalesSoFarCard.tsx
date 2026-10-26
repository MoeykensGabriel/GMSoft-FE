import { useQuery } from '@tanstack/react-query'
import { Button, formatMoney } from '../../core'
import { sessionService } from '../services/sessionService'
import { salesSummaryLine } from '../utils/salesSummaryLine'

export function SalesSoFarCard({ sessionId }: { sessionId: string }) {
  const summary = useQuery({
    queryKey: ['sessions', sessionId, 'sales-summary'],
    queryFn: () => sessionService.getSalesSummary(sessionId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30_000,
  })

  if (!summary.data) return <div className="ui-card p-3" role={summary.isError ? 'alert' : 'status'}>
    {summary.isError ? <>
      <p className="text-sm text-muted">No se pudo cargar lo vendido hoy.</p>
      <Button variant="secondary" onClick={() => void summary.refetch()}>Reintentar</Button>
    </> : <p className="text-sm text-muted">Cargando lo vendido hoy…</p>}
  </div>

  const line = salesSummaryLine(summary.data)
  return <details className="ui-card min-w-0 p-3">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
      <span className="ml-1 inline-flex max-w-full flex-wrap items-center gap-2 align-middle">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-xl font-bold text-white">$</span>
        <span>Vendido hoy</span>
        <span className="break-all text-2xl font-bold tabular-nums text-success">{formatMoney(summary.data.total)}</span>
      </span>
      {line && <span className="mt-2 block text-xs font-normal text-muted">{line}</span>}
    </summary>
    {summary.data.products.length > 0 && <ul className="mt-2 flex flex-col gap-2">
      {summary.data.products.map((product) => <li key={product.productId} className="flex items-start justify-between gap-3 text-sm">
        <span className="min-w-0 break-words">{product.productDetail}</span>
        <span className="shrink-0 font-bold tabular-nums">{product.quantity}</span>
      </li>)}
    </ul>}
  </details>
}
