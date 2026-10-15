import { api } from '../../core'

export interface VehiclePerformance {
  vehicleId: string
  vehicleName: string
  licensePlate: string
  driverNames: string[]
  sessions: number
  closedSessions: number
  sold: number
  collected: number
  collectedByMethod: { cash: number; transfer: number; card: number }
  onAccount: number
  collectedPercent: number | null
  routeCustomers: number
  visitedCustomers: number
  buyingCustomers: number
  buyingPercent: number | null
  visits: number
  sales: number
  averageTicket: number | null
  noPurchase: { total: number; byReason: Record<string, number> }
  unitsByProduct: { productId: string; productDetail: string; units: number; amount: number }[]
  shortages: { full: number; empty: number }
  cashDifference: number
  kilometers: number
  soldPerKilometer: number | null
}
export interface VehiclePerformanceReport { from: string; to: string; vehicles: VehiclePerformance[] }

export const vehiclePerformanceService = {
  get: (from: string, to: string) => api.get<VehiclePerformanceReport>(
    `/api/reports/vehicle-performance?${new URLSearchParams({ from, to })}`,
  ),
}
