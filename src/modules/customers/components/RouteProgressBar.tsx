import type { RouteProgress } from '../utils/routeProgress'
import { share } from '../utils/routeProgress'

/** Barra del recorrido: verde compraron, ámbar visitados sin compra, gris pendientes. */
export function RouteProgressBar({ progress }: { progress: RouteProgress }) {
  const { total, sold, noPurchase } = progress
  if (total === 0) return null
  const done = sold + noPurchase
  const complete = done === total
  return (
    <div className="ui-card flex items-center gap-3 bg-surface p-3">
      <div
        role="progressbar" aria-label="Avance del recorrido" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
        aria-valuetext={`${done} de ${total} visitados, ${sold} compraron`}
        className={`flex h-5 flex-1 overflow-hidden rounded-full bg-line shadow-inner ${complete ? 'ring-2 ring-success-light' : ''}`}
      >
        <span className="h-full bg-gradient-to-b from-green-500 to-success transition-[width] duration-700 ease-out" style={{ width: `${share(sold, total)}%` }} />
        <span className="h-full bg-gradient-to-b from-amber-300 to-amber-500 transition-[width] duration-700 ease-out" style={{ width: `${share(noPurchase, total)}%` }} />
      </div>
      <span aria-hidden="true" className={`min-w-12 text-right text-sm font-semibold tabular-nums ${complete ? 'text-success' : 'text-muted'}`}>
        {complete ? '✓' : `${done}/${total}`}
      </span>
    </div>
  )
}
