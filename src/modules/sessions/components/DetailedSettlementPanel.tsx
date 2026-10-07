import { useQuery } from '@tanstack/react-query'
import { formatDate, formatMoney } from '../../core'
import { sessionService } from '../services/sessionService'

/**
 * La liquidacion detallada de una salida: un bloque por cliente visitado, en el
 * orden del recorrido, con lo que llevo, los envases que devolvio, con que pago y
 * como quedo su cuenta.
 */
export function DetailedSettlementPanel({ sessionId }: { sessionId: string }) {
  const detalle = useQuery({
    queryKey: ['sessions', 'detailed-settlement', sessionId],
    queryFn: () => sessionService.getDetailedSettlement(sessionId),
  })

  if (detalle.isLoading) return <p className="text-sm text-neutral-500">Cargando el detalle...</p>
  if (detalle.isError) return <p className="text-sm text-red-600">No se pudo leer el detalle por cliente.</p>
  if (!detalle.data) return null

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-neutral-700">Detalle por cliente</h3>

      {detalle.data.length === 0 && (
        <p className="rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
          Todavía no se registraron visitas en esta salida.
        </p>
      )}

      {detalle.data.map((c) => (
        <div key={c.customerId} className="overflow-x-auto rounded-md border border-neutral-200 bg-white text-sm">
          <div className="grid gap-x-4 gap-y-1 bg-green-100 px-3 py-2 font-semibold text-neutral-900 sm:grid-cols-[1fr_2fr_auto]">
            <span>{c.customerName}</span>
            <span>{c.customerAddress}</span>
            <span>{c.customerPhone}</span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-700">
                <th className="px-3 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 text-right font-semibold">Cant</th>
                <th className="px-3 py-2 font-semibold">Detalle</th>
                <th className="px-3 py-2 text-right font-semibold">Debe</th>
              </tr>
            </thead>
            <tbody>
              {c.lines.map((linea, i) => (
                <tr key={i} className="border-b border-neutral-100">
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
                <tr key={envase.productDetail} className="bg-cyan-100">
                  <td className="px-3 py-2 font-semibold">Envase devuelto</td>
                  <td className="px-3 py-2 text-right">{envase.quantity}</td>
                  <td className="px-3 py-2" colSpan={2}>{envase.productDetail}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 bg-red-100 px-3 py-2 font-semibold text-neutral-900">
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
