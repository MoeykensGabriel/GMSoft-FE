import { useQuery } from '@tanstack/react-query'
import { formatDate, formatMoney, DataTable } from '../../core'
import { detailedSettlementQuery } from '../hooks/detailedSettlementQuery'

/**
 * La liquidacion detallada de una salida: un bloque por cliente visitado, en el
 * orden del recorrido, con lo que llevo, los envases que devolvio, con que pago y
 * como quedo su cuenta.
 */
export function DetailedSettlementPanel({ sessionId }: { sessionId: string }) {
  const detalle = useQuery(detailedSettlementQuery(sessionId))

  if (detalle.isLoading) return <p className="text-sm text-muted">Cargando el detalle...</p>
  if (detalle.isError) return <p className="text-sm text-danger">No se pudo leer el detalle por cliente.</p>
  if (!detalle.data) return null

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted">Detalle por cliente</h3>

      {detalle.data.length === 0 && (
        <p className="ui-card bg-surface p-3 text-sm text-muted">
          Todavía no se registraron visitas en esta salida.
        </p>
      )}

      {detalle.data.map((c) => (
        <div key={c.customerId} className="overflow-x-auto ui-card bg-surface text-sm">
          <div className="grid gap-x-4 gap-y-1 bg-accent-soft px-3 py-2 font-semibold text-ink sm:grid-cols-[1fr_2fr_auto]">
            <span>{c.customerName}</span>
            <span>{c.customerAddress}</span>
            <span>{c.customerPhone}</span>
          </div>

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

          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 bg-canvas px-3 py-2 font-semibold text-ink">
            <span>Efectivo {formatMoney(c.cash)}</span>
            <span>Transferencia {formatMoney(c.transfer)}</span>
            <span>Tarjeta {formatMoney(c.card)}</span>
            <span>Saldo: {formatMoney(c.balance)}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
