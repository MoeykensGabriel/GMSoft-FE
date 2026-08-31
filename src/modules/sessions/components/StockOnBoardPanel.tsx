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
      <h3 className="text-sm font-medium text-slate-700">
        {cerrada ? 'Faltante al cerrar' : 'A bordo ahora'}
      </h3>

      {pendiente.length === 0 ? (
        <p
          className={`rounded-md border p-3 text-sm ${
            cerrada
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {cerrada ? 'Cuadró todo.' : 'Sin stock a bordo.'}
        </p>
      ) : (
        <ul
          className={`flex flex-col gap-1 rounded-md border p-3 text-sm ${
            cerrada ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
          }`}
        >
          {pendiente.map((l) => (
            <li key={l.productId} className="flex justify-between">
              <span className={cerrada ? 'text-red-700' : 'text-slate-700'}>{l.productDetail}</span>
              <span className={cerrada ? 'text-red-800' : 'text-slate-900'}>
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
