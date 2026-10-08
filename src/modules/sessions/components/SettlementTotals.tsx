import { DataTable, formatMoney } from '../../core'
import type { CustomerSettlement } from '../services/sessionService'

interface Total { detail: string; quantity: number; amount: number }

/** Suma por producto conservando el orden en que aparece cada uno. */
function sumar(filas: Total[]): Total[] {
  const porProducto = new Map<string, Total>()
  for (const fila of filas) {
    const actual = porProducto.get(fila.detail)
    if (actual) { actual.quantity += fila.quantity; actual.amount += fila.amount }
    else porProducto.set(fila.detail, { ...fila })
  }
  return [...porProducto.values()].sort((a, b) => a.detail.localeCompare(b.detail))
}

/**
 * Totales generales de la liquidación: cuánto entró por cada forma de pago, qué
 * envases volvieron y qué se vendió. Se calcula con el mismo detalle por cliente
 * que se muestra arriba, así los números siempre coinciden.
 */
export function SettlementTotals({ settlements }: { settlements: CustomerSettlement[] }) {
  const pagos = [
    { label: 'Total efectivo', amount: settlements.reduce((sum, c) => sum + c.cash, 0) },
    { label: 'Total transferencia', amount: settlements.reduce((sum, c) => sum + c.transfer, 0) },
    { label: 'Total tarjeta', amount: settlements.reduce((sum, c) => sum + c.card, 0) },
  ]
  const envases = sumar(settlements.flatMap((c) => c.returnedContainers.map((envase) => (
    { detail: envase.productDetail, quantity: envase.quantity, amount: 0 }))))
  const productos = sumar(settlements.flatMap((c) => c.lines.filter((linea) => linea.type !== 'ContainerOnly').map((linea) => (
    { detail: linea.productDetail, quantity: linea.quantity, amount: linea.amount }))))

  return (
    <section className="ui-card flex flex-col gap-4 bg-surface" aria-label="Totales generales de la liquidación">
      <h2 className="rounded-t bg-brand px-4 py-3 text-base font-semibold text-white">Totales generales</h2>

      <div className="grid gap-3 px-4 sm:grid-cols-3">
        {pagos.map((pago) => (
          <div key={pago.label} className="rounded border border-accent bg-accent-soft px-4 py-3 text-center">
            <p className="text-sm font-medium text-brand-dark">{pago.label}</p>
            <p className="text-2xl font-semibold text-ink">{formatMoney(pago.amount)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4">
        <DataTable label="Total de envases devueltos" className="w-full">
          <thead>
            <tr><th scope="col">Envases devueltos</th><th scope="col" className="text-right">Cantidad</th></tr>
          </thead>
          <tbody>
            {envases.length === 0 && <tr><td colSpan={2} className="text-muted">Todavía no se devolvieron envases.</td></tr>}
            {envases.map((envase) => (
              <tr key={envase.detail}><td>{envase.detail}</td><td className="text-right">{envase.quantity}</td></tr>
            ))}
            <tr className="bg-accent-soft font-semibold">
              <td>Total de envases</td>
              <td className="text-right">{envases.reduce((sum, envase) => sum + envase.quantity, 0)}</td>
            </tr>
          </tbody>
        </DataTable>

        <DataTable label="Total de productos vendidos" className="w-full">
          <thead>
            <tr>
              <th scope="col">Productos vendidos</th>
              <th scope="col" className="text-right">Cantidad</th>
              <th scope="col" className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && <tr><td colSpan={3} className="text-muted">Todavía no se registraron ventas.</td></tr>}
            {productos.map((producto) => (
              <tr key={producto.detail}>
                <td>{producto.detail}</td>
                <td className="text-right">{producto.quantity}</td>
                <td className="text-right">{formatMoney(producto.amount)}</td>
              </tr>
            ))}
            <tr className="bg-accent-soft font-semibold">
              <td>Total general</td>
              <td className="text-right">{productos.reduce((sum, producto) => sum + producto.quantity, 0)}</td>
              <td className="text-right">{formatMoney(productos.reduce((sum, producto) => sum + producto.amount, 0))}</td>
            </tr>
          </tbody>
        </DataTable>
      </div>
    </section>
  )
}
