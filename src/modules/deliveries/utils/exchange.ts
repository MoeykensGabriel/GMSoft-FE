import type { Product } from '../../products'
import type { DeliveryLine } from '../components/DeliveryLinesEditor'

// Es informativo: con saldos o grupos desactualizados, el servidor decide al registrar.
export function exchangeSummary(
  lines: Pick<DeliveryLine, 'productId' | 'vende' | 'retiraEnvases'>[],
  products: Pick<Product, 'id' | 'detail' | 'tracking' | 'exchangeGroup'>[],
  balances: { productId: string; quantity: number }[],
): string[] {
  const group = (id: string) => {
    const product = products.find((p) => p.id === id)
    return product?.tracking === 'ByBalance' ? product.exchangeGroup?.trim().toUpperCase() : undefined
  }
  const byId = (a: { productId: string }, b: { productId: string }) => a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0
  const used = new Map<string, number>()
  const summary: string[] = []
  for (const line of [...lines].sort(byId)) {
    const excess = line.retiraEnvases - (balances.find((b) => b.productId === line.productId)?.quantity ?? 0) - line.vende
    if (excess <= 0) continue
    const key = group(line.productId)
    const sold = lines.filter((l) => key && group(l.productId) === key && l.vende > 0)
    const others = sold.filter((l) => l.productId !== line.productId).sort((a, b) => b.vende - a.vende || byId(a, b))
    if (!key || others.reduce((sum, l) => sum + l.vende, 0) < excess ||
      sold.reduce((sum, l) => sum + l.vende, 0) - (used.get(key) ?? 0) < excess) return []
    used.set(key, (used.get(key) ?? 0) + excess)
    summary.push(`Cambio de envase: ${excess} ${products.find((p) => p.id === line.productId)!.detail} por ${products.find((p) => p.id === others[0].productId)!.detail}`)
  }
  return summary
}
