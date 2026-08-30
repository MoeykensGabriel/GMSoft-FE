import type { SessionStockLine } from '../services/sessionService'

export interface ReturnLine {
  productId: string
  llenos: number
  vacios: number
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
 */
export function ReturnsEditor({ stock, lineas, onChange }: Props) {
  function set(productId: string, campo: 'llenos' | 'vacios', valor: number) {
    const actual = lineas.find((l) => l.productId === productId) ?? {
      productId,
      llenos: 0,
      vacios: 0,
    }
    const resto = lineas.filter((l) => l.productId !== productId)
    onChange([...resto, { ...actual, [campo]: valor }])
  }

  const valorDe = (productId: string, campo: 'llenos' | 'vacios') =>
    lineas.find((l) => l.productId === productId)?.[campo] ?? 0

  if (stock.length === 0) {
    return <p className="text-sm text-slate-500">No queda nada a bordo para descargar.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-slate-700">Qué volvió en el camión</span>

      {stock.map((s) => {
        // Un campo que todavia no se toco no es un faltante, es un conteo pendiente.
        // Sin esto la pantalla arranca gritando que falta todo y el aviso deja de
        // significar algo cuando de verdad falta.
        const contado = lineas.some((l) => l.productId === s.productId)

        const difLlenos = contado ? valorDe(s.productId, 'llenos') - s.fullOnBoard : 0
        const difVacios = contado ? valorDe(s.productId, 'vacios') - s.emptyOnBoard : 0

        return (
          <div key={s.productId} className="rounded-md border border-slate-200 bg-white p-3">
            <span className="text-sm font-medium text-slate-800">{s.productDetail}</span>

            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ['llenos', 'Llenos', s.fullOnBoard, difLlenos],
                  ['vacios', 'Vacíos', s.emptyOnBoard, difVacios],
                ] as const
              ).map(([campo, etiqueta, esperado, diferencia]) => (
                <label key={campo} className="flex flex-col gap-1">
                  <span className="text-xs text-slate-600">
                    {etiqueta} · deberían ser {esperado}
                  </span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Contá y anotá"
                    value={valorDe(s.productId, campo) || ''}
                    onChange={(e) => set(s.productId, campo, Number(e.target.value) || 0)}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  {diferencia !== 0 && (
                    <span
                      className={diferencia < 0 ? 'text-xs text-red-600' : 'text-xs text-amber-700'}
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
