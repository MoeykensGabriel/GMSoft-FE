import { Panel } from '../../core'
import type { SessionStockLine } from '../services/sessionService'

interface Props {
  stock: SessionStockLine[]
  cerrada: boolean
}

/**
 * Lo que sigue figurando a bordo del camion.
 *
 * Es el mismo numero con dos significados opuestos segun el estado de la salida: en
 * una abierta es lo que el chofer lleva encima, y en una cerrada es lo que nunca
 * volvio, o sea el faltante. Por eso cambia el titulo y el color: confundirlos seria
 * el peor error posible en esta pantalla.
 */
export function StockOnBoardPanel({ stock, cerrada }: Props) {
  const pendiente = stock.filter((l) => l.fullOnBoard !== 0 || l.emptyOnBoard !== 0)
  const llenos = pendiente.reduce((sum, l) => sum + l.fullOnBoard, 0)
  const vacios = pendiente.reduce((sum, l) => sum + l.emptyOnBoard, 0)

  return (
    <Panel title={cerrada ? 'Faltante al cerrar' : 'A bordo ahora'}>
      {pendiente.length === 0 ? (
        <p className={`rounded border px-4 py-3 text-lg font-semibold ${
          cerrada ? 'border-success/40 bg-success-soft text-success-dark' : 'border-line bg-canvas text-muted'
        }`}>
          {cerrada ? 'Cuadró todo: no falta nada.' : 'Sin stock a bordo.'}
        </p>
      ) : (
        <>
          <p className={`text-lg font-semibold ${cerrada ? 'text-danger-dark' : 'text-ink'}`}>
            {cerrada ? 'Faltan ' : 'Lleva '}{llenos} llenos y {vacios} vacíos
          </p>
          <ul className={`flex flex-col divide-y rounded border ${
            cerrada ? 'divide-danger/20 border-danger/40 bg-danger-soft' : 'divide-line border-line bg-surface'
          }`}>
            {pendiente.map((l) => (
              <li key={l.productId} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-3">
                <span className="text-base font-medium text-ink">{l.productDetail}</span>
                <span className={`text-lg font-semibold ${cerrada ? 'text-danger-dark' : 'text-ink'}`}>
                  {l.fullOnBoard !== 0 && `${l.fullOnBoard} llenos`}
                  {l.fullOnBoard !== 0 && l.emptyOnBoard !== 0 && ' · '}
                  {l.emptyOnBoard !== 0 && `${l.emptyOnBoard} vacíos`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
