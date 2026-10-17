import { QuantityInput, formatMoney } from '../../core'
import type { SessionStockLine } from '../../sessions'
import type { Product } from '../../products'
import { loanLimits } from '../utils/loans'

export interface DeliveryLine {
  productId: string
  productDetail: string
  vende: number
  retiraEnvases: number
  presta: number
  retiraPrestamo: number
}

interface Props {
  stock: SessionStockLine[]
  prices: Record<string, number | undefined>
  lineas: DeliveryLine[]
  onChange: (lineas: DeliveryLine[]) => void
  products: Product[]
  balances: { productId: string; quantity: number }[]
}

export function DeliveryLinesEditor({ stock, prices, lineas, onChange, products, balances }: Props) {
  type QuantityField = 'vende' | 'retiraEnvases' | 'presta' | 'retiraPrestamo'
  function set(product: { productId: string; productDetail: string }, field: QuantityField, value: number) {
    const current = lineas.find((line) => line.productId === product.productId) ?? {
      productId: product.productId, productDetail: product.productDetail, vende: 0, retiraEnvases: 0, presta: 0, retiraPrestamo: 0,
    }
    const updated = { ...current, [field]: value }
    const rest = lineas.filter((line) => line.productId !== product.productId)
    onChange(updated.vende === 0 && updated.retiraEnvases === 0 && updated.presta === 0 && updated.retiraPrestamo === 0 ? rest : [...rest, updated])
  }
  const quantity = (id: string, field: QuantityField) =>
    lineas.find((line) => line.productId === id)?.[field] ?? 0
  // Sumar centavos evita errores de punto flotante al acumular importes.
  const subtotal = (id: string) => Math.round((prices[id] ?? 0) * 100) * quantity(id, 'vende')
  const ready = stock.every((product) => prices[product.productId] !== undefined)
  const total = stock.reduce((sum, product) => sum + subtotal(product.productId), 0) / 100

  const loans = products.filter((p) => p.canBeLent && p.tracking === 'None').map((p) => ({
    productId: p.id, productDetail: p.detail,
    ...loanLimits(stock.find((s) => s.productId === p.id)?.fullOnBoard ?? 0, quantity(p.id, 'vende'),
      balances.find((b) => b.productId === p.id)?.quantity ?? 0),
  })).filter((p) => p.visible)
  return (
    <div className="flex flex-col gap-4">
      <h2 className="ui-section-heading rounded">Productos a vender</h2>
      {stock.map((product) => {
        const price = prices[product.productId]
        return <div key={product.productId} className="flex flex-col gap-3 ui-card bg-surface p-3">
          <div>
            <h3 className="font-medium">{product.productDetail}</h3>
            <p className="text-sm text-muted">{product.fullOnBoard} disponibles · {price === undefined ? 'Precio pendiente' : `${formatMoney(price)} por unidad`}</p>
          </div>
          <QuantityInput label={`Cantidad de ${product.productDetail}`} value={quantity(product.productId, 'vende')}
            max={Math.min(1000, product.fullOnBoard - quantity(product.productId, 'presta'))} onChange={(value) => set(product, 'vende', value)} />
          <p className="flex justify-between text-sm"><span>Subtotal</span><strong>{price === undefined ? '—' : formatMoney(subtotal(product.productId) / 100)}</strong></p>
        </div>
      })}
      <div aria-live="polite" className="flex justify-between rounded border border-accent bg-accent-soft p-4 text-brand-dark text-lg font-semibold">
        <span>Total de la venta</span><span>{ready ? formatMoney(total) : '—'}</span>
      </div>
      <h2 className="ui-section-heading rounded">Envases que devuelve</h2>
      <p className="text-sm text-muted">Los envases entregados se registran automáticamente con la venta.</p>
      {products.filter((p) => p.tracking === 'ByBalance').map((product) => <QuantityInput key={product.id} label={`Vacíos de ${product.detail}`}
        max={1000} value={quantity(product.id, 'retiraEnvases')}
        onChange={(value) => set({ productId: product.id, productDetail: product.detail }, 'retiraEnvases', value)} />)}
      {loans.length > 0 && <>
        <h2 className="ui-section-heading rounded">Préstamos</h2>
        {loans.map((product) => <div key={product.productId} className="ui-card flex flex-col gap-3 p-3">
          <QuantityInput label={`Prestar ${product.productDetail}`} value={quantity(product.productId, 'presta')}
            max={product.maxOut} onChange={(value) => set(product, 'presta', value)} />
          <QuantityInput label={`Retirar ${product.productDetail}`} value={quantity(product.productId, 'retiraPrestamo')}
            max={product.maxIn} onChange={(value) => set(product, 'retiraPrestamo', value)} />
        </div>)}
      </>}
    </div>
  )
}
