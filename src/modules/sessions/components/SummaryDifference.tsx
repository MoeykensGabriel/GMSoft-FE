import { formatMoney } from '../../core'
import { summaryDifference } from '../utils/dailySummary'

export function SummaryDifference({ value, isClosed, money = false }: {
  value: number | null
  isClosed: boolean
  money?: boolean
}) {
  const { highlight, label } = summaryDifference(value, isClosed)
  return <td className={`text-right tabular-nums ${highlight ? 'bg-danger-soft text-danger-dark' : ''}`}>
    {value === null ? label : <>
      {money ? formatMoney(value) : value}
      {label && <span className="ml-2">({label})</span>}
    </>}
  </td>
}
