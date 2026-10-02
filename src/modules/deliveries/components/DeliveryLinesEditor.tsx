import type { SessionStockLine } from '../../sessions'

export interface DeliveryLine {
  productId: string
  productDetail: string
  /** Cuanto se le vende. */
  vende: number
  /** Vacios que devuelve y suben al camion. */
  retiraEnvases: number
}

interface Props {
  stock: SessionStockLine[]
  lineas: DeliveryLine[]
  onChange: (lineas: DeliveryLine[]) => void
}

/**
 * La venta entrega automáticamente los envases retornables correspondientes.
 * El chofer solo indica cuántos llenos entrega y cuántos vacíos recibe.
 */
export function DeliveryLinesEditor({ stock, lineas, onChange }: Props) {
  function set(productId: string, productDetail: string, campo: keyof DeliveryLine, valor: number) {
    const actual = lineas.find((l) => l.productId === productId) ?? {
      productId,
      productDetail,
      vende: 0,
      retiraEnvases: 0,
    }

    const actualizada = { ...actual, [campo]: valor }
    const resto = lineas.filter((l) => l.productId !== productId)

    // La fila que quedo toda en cero no aporta nada y no se manda.
    const vacia =
      actualizada.vende === 0 && actualizada.retiraEnvases === 0

    onChange(vacia ? resto : [...resto, actualizada])
  }

  const valorDe = (productId: string, campo: keyof DeliveryLine) => {
    const l = lineas.find((x) => x.productId === productId)
    return l ? (l[campo] as number) : 0
  }

  if (stock.length === 0) {
    return <p className="text-sm text-neutral-500">No tenés nada a bordo para vender.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-neutral-700">Qué pasó en la puerta</span>
      <p className="text-sm text-neutral-600">Los envases entregados se registran automáticamente con la venta.</p>

      {stock.map((s) => (
        <div key={s.productId} className="rounded-md border border-neutral-200 bg-white p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-neutral-800">{s.productDetail}</span>
            <span className="text-neutral-500">{s.fullOnBoard} a bordo</span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ['vende', 'Vende'],
                ['retiraEnvases', 'Retira vacíos'],
              ] as const
            ).map(([campo, etiqueta]) => (
              <label key={campo} className="flex flex-col gap-1">
                <span className="text-xs text-neutral-600">{etiqueta}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  max={campo === 'vende' ? Math.max(0, s.fullOnBoard) : undefined}
                  inputMode="numeric"
                  placeholder="0"
                  value={valorDe(s.productId, campo) || ''}
                  onChange={(e) =>
                    set(s.productId, s.productDetail, campo, Number(e.target.value) || 0)
                  }
                  className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
