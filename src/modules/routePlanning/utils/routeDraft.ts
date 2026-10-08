import type { RouteChange, RouteCustomer, RouteFilters, RouteSave, RouteSnapshot } from '../types'

export function moveRow<T>(rows: T[], from: number, to: number): T[] {
  if (from < 0 || from >= rows.length || to < 0 || to >= rows.length || from === to) return rows
  const next = [...rows]
  const [row] = next.splice(from, 1)
  next.splice(to, 0, row)
  return next
}

/** Drop boundaries are between rows, so dropping below the last row works too. */
export function dropRow<T>(rows: T[], from: number, boundary: number): T[] {
  return moveRow(rows, from, boundary > from ? boundary - 1 : boundary)
}

export function sameDays(left: number[], right: number[]) {
  return left.length === right.length && left.every((day) => right.includes(day))
}

export function rowModified(row: RouteCustomer, index: number, baseline: RouteCustomer[]) {
  const originalIndex = baseline.findIndex((item) => item.id === row.id)
  const original = baseline[originalIndex]
  return !original || originalIndex !== index || row.vehicleId !== original.vehicleId || !sameDays(row.visitDays, original.visitDays)
}

export function hasChanges(rows: RouteCustomer[], baseline: RouteCustomer[]) {
  return rows.length !== baseline.length || rows.some((row, index) => rowModified(row, index, baseline))
}

export function toggleVisitDay(days: number[], day: number): number[] | null {
  if (days.includes(day) && days.length === 1) return null
  return days.includes(day) ? days.filter((value) => value !== day) : [...days, day].sort((a, b) => a - b)
}

export function buildRouteSave(filters: RouteFilters, baseline: RouteSnapshot, rows: RouteCustomer[]): RouteSave {
  const originals = new Map(baseline.items.map((row) => [row.id, row]))
  const changes: RouteChange[] = []
  for (const row of rows) {
    const original = originals.get(row.id)!
    const change: RouteChange = { id: row.id }
    if (!sameDays(row.visitDays, original.visitDays)) change.visitDays = [...row.visitDays].sort((a, b) => a - b)
    if (row.vehicleId !== original.vehicleId) change.vehicleId = row.vehicleId
    if (change.visitDays || change.vehicleId) changes.push(change)
  }
  return { ...filters, version: baseline.version, customerIds: rows.map((row) => row.id), changes }
}
