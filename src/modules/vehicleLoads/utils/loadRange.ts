type Range = { min: number | null; max: number | null }

export function rangeStatus(quantity: number, range?: Range): 'ok' | 'low' | 'high' {
  if (!range) return 'ok'
  if (range.min !== null && quantity < range.min) return 'low'
  if (range.max !== null && quantity > range.max) return 'high'
  return 'ok'
}

export function rangeLabel(range?: Range): string {
  if (!range) return ''
  if (range.min !== null && range.max !== null) return `${range.min} – ${range.max}`
  if (range.max !== null) return `hasta ${range.max}`
  if (range.min !== null) return `desde ${range.min}`
  return ''
}

export function rangeErrors(rows: (Range & { productId: string })[]) {
  const errors: Record<string, { min?: string; max?: string }> = {}
  for (const row of rows) {
    const error: { min?: string; max?: string } = {}
    for (const field of ['min', 'max'] as const) {
      const value = row[field]
      if (value !== null && (!Number.isInteger(value) || value < 0 || value > 100000)) {
        error[field] = 'Usá un entero entre 0 y 100000.'
      }
    }
    if (row.min !== null && row.max !== null && row.max < row.min) error.max = 'Máx debe ser mayor o igual a Mín.'
    if (error.min || error.max) errors[row.productId] = error
  }
  return errors
}
