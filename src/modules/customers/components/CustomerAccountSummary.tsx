import { formatMoney } from '../../core'
import type { CustomerAccount } from '../services/customerService'
import { CustomerContainersSummary } from './CustomerContainersSummary'

export function CustomerAccountSummary({ account }: { account: CustomerAccount }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div>
        <span className="font-medium">Envases pendientes</span>
        <p><CustomerContainersSummary account={account} /></p>
      </div>
      <p className="ui-card px-3 py-2">
        {account.balance < 0 ? 'Saldo a favor' : 'Debe'}: <strong>{formatMoney(Math.abs(account.balance))}</strong>
      </p>
    </div>
  )
}
