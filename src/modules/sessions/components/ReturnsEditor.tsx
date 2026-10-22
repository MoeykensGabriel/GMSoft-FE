import type { SessionStockLine } from '../services/sessionService'

/** Nulo es «todavía no lo conté»; cero es «lo conté y no volvió ninguno». */
export interface ReturnLine {
  productId: string
  llenos: number | null
  vacios: number | null
}

interface Props {
  stock: SessionStockLine[]
  lineas: ReturnLine[]
  onChange: (lineas: ReturnLine[]) => void
}

/**
 * El control de recepcion: cuanto volvio realmente del camion.
 *
 * Los campos arrancan VACIOS a proposito, no precargados con lo que el sistema cree
 * que hay. Si vinieran con el numero puesto, alcanzaria con apretar cerrar sin contar
 * nada y el faltante daria cero siempre, que es exactamente lo que este control
 * existe para detectar. Al lado se muestra lo esperado y la diferencia en vivo.
 * El cero se escribe como cualquier otro número: dejar el campo en blanco no dice
 * si se contó o no.
 */
export function ReturnsEditor({ stock, lineas, onChange }: Props) {
  function set(productId: string, campo: 'llenos' | 'vacios', valor: number | null) {
    const actual = lineas.find((l) => l.productId === productId) ?? {
      productId,
      llenos: null,
      vacios: null,
    }
    const resto = lineas.filter((l) => l.productId !== productId)
    onChange([...resto, { ...actual, [campo]: valor }])
  }

  const valorDe = (productId: string, campo: 'llenos' | 'vacios') =>
    lineas.find((l) => l.productId === productId)?.[campo] ?? null

  if (stock.length === 0) {
    return <p className="text-sm text-muted">No queda nada a bordo para descargar.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-muted">Qué volvió en el camión</span>

      {stock.map((s) => {
        // Un campo que todavia no se toco no es un faltante, es un conteo pendiente.
        // Sin esto la pantalla arranca gritando que falta todo y el aviso deja de
        // significar algo cuando de verdad falta.
        const llenos = valorDe(s.productId, 'llenos')
        const vacios = valorDe(s.productId, 'vacios')
        const difLlenos = llenos === null ? 0 : llenos - s.fullOnBoard
        const difVacios = vacios === null ? 0 : vacios - s.emptyOnBoard

        return (
          <div key={s.productId} className="ui-card bg-surface p-3">
            <span className="text-sm font-medium text-ink">{s.productDetail}</span>

            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ['llenos', 'Llenos', s.fullOnBoard, difLlenos],
                  ['vacios', 'Vacíos', s.emptyOnBoard, difVacios],
                ] as const
              ).map(([campo, etiqueta, esperado, diferencia]) => (
                <label key={campo} className="flex flex-col gap-1">
                  <span className="text-xs text-muted">
                    {etiqueta} · deberían ser {esperado}
                  </span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Contá y anotá"
                    value={valorDe(s.productId, campo) ?? ''}
                    onChange={(e) => set(s.productId, campo,
                      e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value)) || 0))}
                    className="ui-input"
                  />
                  {diferencia !== 0 && (
                    <span
                      className={diferencia < 0 ? 'text-xs text-danger' : 'text-xs text-warning'}
                    >
                      {diferencia < 0 ? `faltan ${-diferencia}` : `sobran ${diferencia}`}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
