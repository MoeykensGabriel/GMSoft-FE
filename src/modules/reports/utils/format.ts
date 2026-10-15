const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })
export function abbreviatedMoney(value: number): string {
  const absolute = Math.abs(value)
  const divisor = absolute >= 999_950 ? 1_000_000 : absolute >= 1_000 ? 1_000 : 1
  return `${value < 0 ? '-' : ''}$${decimal.format(absolute / divisor)}${divisor === 1_000_000 ? ' M' : divisor === 1_000 ? ' k' : ''}`
}

export const formatPercent = (value: number | null) => value === null ? '—'
  : new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 }).format(value)
