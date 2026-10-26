import { useQuery } from '@tanstack/react-query'
import { Badge, formatDate, formatMoney } from '../../core'
import { noPurchaseLabel } from '../../customers'
import { detailedSettlementQuery } from '../hooks/detailedSettlementQuery'

type SettlementCustomer = NonNullable<ReturnType<typeof useDetailedSettlement>['data']>[number]
function useDetailedSettlement(sessionId: string) { return useQuery(detailedSettlementQuery(sessionId)) }

/** Día y mes: la liquidación es de una salida, el año no agrega nada. */
const day = (date: string) => formatDate(date).slice(0, 5)

/**
 * La card de un cliente. Es la misma en la compu y en el celular, con los mismos
 * colores, textos y detalles; solo cambian el tamaño y cómo se acomoda el encabezado.
 */
function CustomerCard({ customer: c }: { customer: SettlementCustomer }) {
  const pagos = ([['Efectivo', c.cash], ['Transferencia', c.transfer], ['Tarjeta', c.card]] as const).filter(([, monto]) => monto > 0)
  // Borde marcado: al bajar por la lista se tiene que ver dónde empieza y termina cada cliente.
  return <article className="rounded border-2 border-muted bg-surface text-sm shadow-sm md:text-base">
    {/* En el celular el nombre queda fijo arriba mientras se baja por su card. */}
    <header className="sticky top-[60px] z-10 grid gap-x-6 gap-y-1 border-b border-line bg-accent-soft px-3 py-2 text-ink md:static md:grid-cols-[1fr_2fr_auto] md:items-baseline md:px-4 md:py-3">
      <span className="text-base font-bold md:text-lg">{c.customerName} {c.isOutOfRoute && <Badge tone="warning">Fuera de su día</Badge>}</span>
      <span>{c.customerAddress}</span>
      <span>{c.customerPhone}</span>
    </header>

    <ul className="flex flex-col divide-y divide-line">
      {(c.noPurchases ?? []).map((visit) => <li key={visit.date} className="flex gap-3 px-3 py-2 md:px-4 md:py-2.5">
        <span className="w-12 shrink-0 text-muted">{day(visit.date)}</span>
        <span className="min-w-0 flex-1">No compró — {noPurchaseLabel(visit.reason)}
          {visit.notes && <span className="block text-muted">{visit.notes}</span>}</span>
      </li>)}
      {c.lines.map((linea, i) => <li key={i} className="flex items-baseline gap-3 px-3 py-2 md:px-4 md:py-2.5">
        <span className="w-12 shrink-0 text-muted">{day(linea.date)}</span>
        <span className="min-w-0 flex-1">{linea.quantity} × {linea.productDetail}{linea.type === 'Promotion' && ' (promoción)'}</span>
        <span className="shrink-0 font-semibold">{formatMoney(linea.amount)}</span>
      </li>)}
      {c.returnedContainers.length > 0 && <li className="bg-accent-soft px-3 py-2 md:px-4 md:py-2.5">
        <span className="font-semibold">Devolvió:</span> {c.returnedContainers.map((e) => `${e.quantity} ${e.productDetail}`).join(' · ')}
      </li>}
    </ul>

    {/* Solo el medio que se usó, resaltado: lo que está en cero no aporta y distrae. */}
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line bg-canvas px-3 py-2 font-semibold text-ink md:px-4 md:py-3">
      <span className="flex flex-wrap gap-2">
        {pagos.map(([medio, monto]) => <span key={medio} className="rounded bg-success-light px-2 py-1 text-black">{medio} {formatMoney(monto)}</span>)}
      </span>
      <span className="py-1">Saldo: {formatMoney(c.balance)}</span>
    </footer>
  </article>
}

/**
 * La liquidacion detallada de una salida: un bloque por cliente visitado, en el
 * orden del recorrido, con lo que llevo, los envases que devolvio, con que pago y
 * como quedo su cuenta.
 */
export function DetailedSettlementPanel({ sessionId }: { sessionId: string }) {
  const detalle = useDetailedSettlement(sessionId)

  if (detalle.isLoading) return <p className="text-sm text-muted">Cargando el detalle...</p>
  if (detalle.isError) return <p className="text-sm text-danger">No se pudo leer el detalle por cliente.</p>
  if (!detalle.data) return null

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-muted">Detalle por cliente</h3>

      {detalle.data.length === 0 && (
        <p className="ui-card bg-surface p-3 text-sm text-muted">
          Todavía no se registraron visitas en esta salida.
        </p>
      )}

      {detalle.data.map((c) => <CustomerCard key={c.customerId} customer={c} />)}
    </section>
  )
}
