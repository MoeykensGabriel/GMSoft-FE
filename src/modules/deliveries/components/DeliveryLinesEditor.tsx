import { QuantityInput, formatMoney } from '../../core'
import type { SessionStockLine } from '../../sessions'

export interface DeliveryLine {
  productId: string
  productDetail: string
  vende: number
  retiraEnvases: number
}

interface Props {
  stock: SessionStockLine[]
  prices: Record<string, number | undefined>
  lineas: DeliveryLine[]
  onChange: (lineas: DeliveryLine[]) => void
}

export function DeliveryLinesEditor({ stock, prices, lineas, onChange }: Props) {
  function set(product: SessionStockLine, field: 'vende' | 'retiraEnvases', value: number) {
    const current = lineas.find((line) => line.productId === product.productId) ?? {
      productId: product.productId, productDetail: product.productDetail, vende: 0, retiraEnvases: 0,
    }
    const updated = { ...current, [field]: value }
    const rest = lineas.filter((line) => line.productId !== product.productId)
    onChange(updated.vende === 0 && updated.retiraEnvases === 0 ? rest : [...rest, updated])
  }
  const quantity = (id: string, field: 'vende' | 'retiraEnvases') =>
    lineas.find((line) => line.productId === id)?.[field] ?? 0
  // Sumar centavos evita errores de punto flotante al acumular importes.
  const subtotal = (id: string) => Math.round((prices[id] ?? 0) * 100) * quantity(id, 'vende')
  const ready = stock.every((product) => prices[product.productId] !== undefined)
  const total = stock.reduce((sum, product) => sum + subtotal(product.productId), 0) / 100

  if (stock.length === 0) return <p>No tenés productos a bordo.</p>
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold">Productos a vender</h2>
      {stock.map((product) => {
        const price = prices[product.productId]
        return <div key={product.productId} className="flex flex-col gap-3 rounded-md border border-neutral-300 bg-white p-3">
          <div>
            <h3 className="font-medium">{product.productDetail}</h3>
            <p className="text-sm text-neutral-600">{product.fullOnBoard} disponibles · {price === undefined ? 'Precio pendiente' : `${formatMoney(price)} por unidad`}</p>
          </div>
          <QuantityInput label={`Cantidad de ${product.productDetail}`} value={quantity(product.productId, 'vende')}
            max={product.fullOnBoard} onChange={(value) => set(product, 'vende', value)} />
          <p className="flex justify-between text-sm"><span>Subtotal</span><strong>{price === undefined ? '—' : formatMoney(subtotal(product.productId) / 100)}</strong></p>
        </div>
      })}
      <div aria-live="polite" className="flex justify-between rounded-md border-2 border-neutral-900 p-4 text-lg font-semibold">
        <span>Total de la venta</span><span>{ready ? formatMoney(total) : '—'}</span>
      </div>
      <h2 className="font-semibold">Envases que devuelve</h2>
      <p className="text-sm text-neutral-600">Los envases entregados se registran automáticamente con la venta.</p>
      {stock.map((product) => <QuantityInput key={product.productId} label={`Vacíos de ${product.productDetail}`}
        value={quantity(product.productId, 'retiraEnvases')} onChange={(value) => set(product, 'retiraEnvases', value)} />)}
    </div>
  )
}
