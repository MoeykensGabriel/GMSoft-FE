import { formatMoney } from '../../core'

export function CustomerBalanceCard({ balance }: { balance: number }) {
  return <p className="rounded-md bg-neutral-900 px-3 py-3 text-center text-xl text-white">
    {balance < 0 ? 'Saldo a favor' : 'Saldo pendiente'}: <strong>{formatMoney(Math.abs(balance))}</strong>
  </p>
}
