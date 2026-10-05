import type { CustomerAccount } from '../services/customerService'

export function CustomerContainersSummary({ account }: { account: CustomerAccount }) {
  const containers = account.containers.filter((line) => line.quantity !== 0)
  if (!containers.length && !account.units.length) return <span>Sin envases pendientes</span>
  return <span>{[
    ...containers.map((line) => `${line.quantity} × ${line.productDetail}`),
    ...account.units.map((unit) => `${unit.productDetail} (${unit.serialNumber})`),
  ].join(' · ')}</span>
}
