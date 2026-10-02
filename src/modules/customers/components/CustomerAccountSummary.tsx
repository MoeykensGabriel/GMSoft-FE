import { formatMoney } from '../../core'
import type { CustomerAccount } from '../services/customerService'

export function CustomerAccountSummary({ account }: { account: CustomerAccount }) {
  const containers = account.containers.filter((line) => line.quantity !== 0)
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div>
        <span className="font-medium">Envases pendientes</span>
        {containers.length === 0 && account.units.length === 0 ? (
          <p className="text-neutral-600">Sin envases pendientes</p>
        ) : (
          <ul>
            {containers.map((line) => (
              <li key={line.productId}>{line.quantity} × {line.productDetail}</li>
            ))}
            {account.units.map((unit) => (
              <li key={unit.containerUnitId}>{unit.productDetail} · {unit.serialNumber}</li>
            ))}
          </ul>
        )}
      </div>
      <p className="rounded-md border border-neutral-300 px-3 py-2">
        {account.balance < 0 ? 'Saldo a favor' : 'Debe'}: <strong>{formatMoney(Math.abs(account.balance))}</strong>
      </p>
    </div>
  )
}
