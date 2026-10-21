import { useQuery } from '@tanstack/react-query'
import { formatDate, formatMoney, DataTable } from '../../core'
import { noPurchaseLabel } from '../../customers'
import { detailedSettlementQuery } from '../hooks/detailedSettlementQuery'

/**
 * La liquidacion detallada de una salida: un bloque por cliente visitado, en el
 * orden del recorrido, con lo que llevo, los envases que devolvio, con que pago y
 * como quedo su cuenta.
 */
/** El medio con que pagó se resalta; los que quedaron en cero pasan a segundo plano. */
function PaymentAmount({ method, amount }: { method: string; amount: number }) {
  return amount > 0
    ? <span className="rounded bg-success-light px-2 py-1 text-black">{method} {formatMoney(amount)}</span>
    // En el celular los medios en cero se ocultan: así el pago y el saldo entran en una línea.
    : <span className="hidden py-1 font-normal text-muted md:inline">{method} {formatMoney(amount)}</span>
}

type SettlementCustomer = NonNullable<ReturnType<typeof useDetailedSettlement>['data']>[number]
function useDetailedSettlement(sessionId: string) { return useQuery(detailedSettlementQuery(sessionId)) }

/**
 * La card del cliente en el celular: un renglón por producto y los envases juntos. La
 * tabla apilada usaba cuatro renglones por producto y un cliente ocupaba varias pantallas.
 */
function CompactDetail({ customer: c }: { customer: SettlementCustomer }) {
  return <ul className="flex flex-col divide-y divide-line md:hidden">
    {(c.noPurchases ?? []).map((visit) => <li key={visit.date} className="px-3 py-2">
      <span className="text-muted">{formatDate(visit.date).slice(0, 5)}</span> No compró — {noPurchaseLabel(visit.reason)}
      {visit.notes && <span className="block text-muted">{visit.notes}</span>}
    </li>)}
    {c.lines.map((linea, i) => <li key={i} className="flex items-baseline gap-2 px-3 py-2">
      <span className="shrink-0 text-muted">{formatDate(linea.date).slice(0, 5)}</span>
      <span className="min-w-0 flex-1">{linea.quantity} × {linea.productDetail}{linea.type === 'Promotion' && ' (promoción)'}</span>
      <span className="shrink-0 font-semibold">{formatMoney(linea.amount)}</span>
    </li>)}
    {c.returnedContainers.length > 0 && <li className="bg-accent-soft px-3 py-2">
      <span className="font-semibold">Devolvió:</span> {c.returnedContainers.map((e) => `${e.quantity} ${e.productDetail}`).join(' · ')}
    </li>}
  </ul>
}

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

      {detalle.data.map((c) => (
        // Borde marcado: al bajar por la lista se tiene que ver dónde empieza y termina cada cliente.
        <div key={c.customerId} className="rounded border-2 border-muted bg-surface text-sm shadow-sm md:overflow-x-auto">
          {/* En el celular el nombre queda fijo arriba mientras se baja por su card. */}
          <div className="sticky top-[60px] z-10 grid gap-x-4 gap-y-1 border-b border-line bg-accent-soft px-3 py-2 text-ink md:static md:grid-cols-[1fr_2fr_auto] md:font-semibold">
            <span className="text-base font-bold md:text-sm md:font-semibold">{c.customerName}</span>
            <span>{c.customerAddress}</span>
            <span>{c.customerPhone}</span>
          </div>

          <CompactDetail customer={c} />

          <div className="hidden md:block">
          <DataTable label="Detalle de liquidación por cliente" className="w-full">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="px-3 py-2 font-semibold">Fecha</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Cant</th>
                <th scope="col" className="px-3 py-2 font-semibold">Detalle</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Debe</th>
              </tr>
            </thead>
            <tbody>
              {(c.noPurchases ?? []).map((visit) => <tr key={visit.date} className="border-b border-line">
                <td>{formatDate(visit.date)}</td><td /><td>No compró — {noPurchaseLabel(visit.reason)}{visit.notes && <span className="block text-muted">{visit.notes}</span>}</td><td />
              </tr>)}
              {c.lines.map((linea, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="px-3 py-2">{formatDate(linea.date)}</td>
                  <td className="px-3 py-2 text-right">{linea.quantity}</td>
                  <td className="px-3 py-2">
                    {linea.productDetail}
                    {linea.type === 'Promotion' && ' (promoción)'}
                  </td>
                  <td className="px-3 py-2 text-right">{formatMoney(linea.amount)}</td>
                </tr>
              ))}
              {c.returnedContainers.map((envase) => (
                <tr key={envase.productDetail} className="bg-accent-soft">
                  <td className="px-3 py-2 font-semibold">Envase devuelto</td>
                  <td className="px-3 py-2 text-right">{envase.quantity}</td>
                  <td className="px-3 py-2" colSpan={2}>{envase.productDetail}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-canvas px-3 py-2 font-semibold text-ink">
            {([['Efectivo', c.cash], ['Transferencia', c.transfer], ['Tarjeta', c.card]] as const).map(([medio, monto]) =>
              <PaymentAmount key={medio} method={medio} amount={monto} />)}
            <span className="py-1">Saldo: {formatMoney(c.balance)}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
