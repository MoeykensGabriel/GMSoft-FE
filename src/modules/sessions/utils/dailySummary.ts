/** Misma fecha local que Liquidación; nunca usar el día UTC de toISOString. */
export function summaryToday(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function summaryDateLabel(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

/** El saldo abierto y el dinero sin rendir nunca representan un faltante. */
export function summaryDifference(value: number | null, isClosed: boolean) {
  if (value === null) return { highlight: false, label: 'Pendiente' }
  if (!isClosed || value === 0) return { highlight: false, label: '' }
  return { highlight: true, label: value > 0 ? 'Faltante' : 'Sobrante' }
}
