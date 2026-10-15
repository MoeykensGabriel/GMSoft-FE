import { DataTable, Panel } from '../../core'
import type { SessionStockLine } from '../services/sessionService'

interface Props {
  stock: SessionStockLine[]
  cerrada: boolean
}

/**
 * Lo que sigue figurando a bordo del camion, por producto.
 *
 * Es el mismo numero con dos significados opuestos segun el estado de la salida: en
 * una abierta es lo que el chofer lleva encima, y en una cerrada es lo que nunca
 * volvio, o sea el faltante. Por eso cambia el titulo y el color: confundirlos seria
 * el peor error posible en esta pantalla.
 *
 * Se muestran todos los productos de la salida, tambien los que quedaron en cero: es
 * la forma de comprobar de un vistazo que el camion se vacio.
 */
export function StockOnBoardPanel({ stock, cerrada }: Props) {
  const llenos = stock.reduce((sum, l) => sum + l.fullOnBoard, 0)
  const vacios = stock.reduce((sum, l) => sum + l.emptyOnBoard, 0)
  const vacio = stock.every((l) => l.fullOnBoard === 0 && l.emptyOnBoard === 0)
  const numero = (n: number) => `text-right text-lg font-semibold ${
    n === 0 ? 'text-muted' : cerrada ? 'text-danger-dark' : 'text-ink'}`

  return (
    <Panel title={cerrada ? 'Faltante al cerrar' : 'A bordo ahora'}>
      {vacio && (
        <p className={`rounded border px-4 py-3 text-lg font-semibold ${
          cerrada ? 'border-success/40 bg-success-soft text-success-dark' : 'border-line bg-canvas text-muted'
        }`}>
          {cerrada ? 'Cuadró todo: no falta nada.' : 'Sin stock a bordo.'}
        </p>
      )}
      {stock.length > 0 && !(cerrada && vacio) && (
        <DataTable stack={false} label={cerrada ? 'Faltante al cerrar por producto' : 'A bordo ahora por producto'}
          className={cerrada && !vacio ? 'bg-danger-soft' : ''}>
          <thead><tr>
            <th scope="col">Producto</th>
            <th scope="col" className="text-right">Llenos</th>
            <th scope="col" className="text-right">Vacíos</th>
            <th scope="col" className="text-right">Total</th>
          </tr></thead>
          <tbody>
            {stock.map((l) => (
              <tr key={l.productId}>
                <td className="text-base font-medium">{l.productDetail}</td>
                <td className={numero(l.fullOnBoard)}>{l.fullOnBoard}</td>
                <td className={numero(l.emptyOnBoard)}>{l.emptyOnBoard}</td>
                <td className={numero(l.fullOnBoard + l.emptyOnBoard)}>{l.fullOnBoard + l.emptyOnBoard}</td>
              </tr>
            ))}
          </tbody>
          {stock.length > 1 && (
            <tfoot><tr className="border-t-2 border-line">
              <th scope="row" className="text-left">Total</th>
              <td className={numero(llenos)}>{llenos}</td>
              <td className={numero(vacios)}>{vacios}</td>
              <td className={numero(llenos + vacios)}>{llenos + vacios}</td>
            </tr></tfoot>
          )}
        </DataTable>
      )}
    </Panel>
  )
}
