import type { PendingSettlement } from '../services/sessionService'

export function countPendingByPlate(items: readonly PendingSettlement[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item.vehicleLicensePlate, (counts.get(item.vehicleLicensePlate) ?? 0) + 1)
  return counts
}

export function filterPendingByPlate(items: readonly PendingSettlement[], plate: string): PendingSettlement[] {
  return items.filter((item) => item.vehicleLicensePlate === plate)
}

export function totalPendingCash(items: readonly PendingSettlement[]): number {
  return items.reduce((total, item) => total + item.cashToDeliver, 0)
}

export function pendingSettlementsLabel(count: number): string {
  return count === 1 ? '1 salida sin rendir' : `${count} salidas sin rendir`
}
