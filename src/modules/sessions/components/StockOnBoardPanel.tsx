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

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted">
        {cerrada ? 'Faltante al cerrar' : 'A bordo ahora'}
      </h3>

      {pendiente.length === 0 ? (
        <p
          className={`rounded border p-3 text-sm ${
            cerrada
              ? 'border-success/30 bg-success-soft text-success-dark'
              : 'border-line bg-surface text-muted'
          }`}
        >
          {cerrada ? 'Cuadró todo.' : 'Sin stock a bordo.'}
        </p>
      ) : (
        <ul
          className={`flex flex-col gap-1 rounded border p-3 text-sm ${
            cerrada ? 'border-danger/30 bg-danger-soft' : 'border-line bg-surface'
          }`}
        >
          {pendiente.map((l) => (
            <li key={l.productId} className="flex justify-between">
              <span className={cerrada ? 'text-danger' : 'text-muted'}>{l.productDetail}</span>
              <span className={cerrada ? 'text-danger-dark' : 'text-ink'}>
                {l.fullOnBoard !== 0 && `${l.fullOnBoard} llenos`}
                {l.fullOnBoard !== 0 && l.emptyOnBoard !== 0 && ' · '}
                {l.emptyOnBoard !== 0 && `${l.emptyOnBoard} vacíos`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
