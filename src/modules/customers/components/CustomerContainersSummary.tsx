import { sortProducts } from '../../core'
import type { CustomerAccount } from '../services/customerService'

/** `vertical`: un envase por renglón, para el panel que se abre con «Envases prestados». */
export function CustomerContainersSummary({ account, vertical = false }: { account: CustomerAccount; vertical?: boolean }) {
  const containers = account.containers.filter((line) => line.quantity !== 0)
  if (!containers.length && !account.units.length) return <span>Sin envases pendientes</span>
  const lines = sortProducts([
    ...containers.map((line) => ({ detail: line.productDetail, text: `${line.quantity} × ${line.productDetail}` })),
    ...account.units.map((unit) => ({ detail: unit.productDetail, text: `${unit.productDetail} (${unit.serialNumber})` })),
  ], (p) => p.detail).map((line) => line.text)
  if (vertical) return <ul className="flex flex-col gap-1">{lines.map((line) => <li key={line}>{line}</li>)}</ul>
  return <span>{lines.join(' · ')}</span>
}
